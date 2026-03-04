# EASI AutoCount Bridge -- Master TODO & Session Continuity

**Last updated:** 2026-03-04 (session 2)
**Reference docs:**

- `docs/autocount-bridge-setup-record.md` -- full setup record with all credentials, paths, configs
- `docs/autocount-integration-rights-snapshot.md` -- AutoCount access rights for INTEGRATION group
- `docs/autocount-user-to-app-schema-mapping.md` -- field mapping between AutoCount and app schema
- `docs/autocount-debtor-columns.md` -- all 82 Debtor table columns with sync mapping

---

## COMPLETED (2026-03-04)

### Phase 0: Preflight Checks -- DONE

- Server: `DESKTOP-20COQHQ`, Windows 10 Pro
- .NET 4.8.1 (release 533325) confirmed
- MSBuild available at `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\`
- AutoCount 2.1 at `C:\Program Files\AutoCount\Accounting 2.1` (NOT x86, NOT "AutoCount Accounting 2.1")
- AutoCount API Module: **ENABLED**
- SQL Server 2022 instance: `A2006` (running)
- Supabase reachable over HTTPS (TCP 443 open)
- 143 GB free disk space
- Script: `bridge/EASIBridge/phase0-preflight.ps1` (was temporary, ran on server)

### Phase 1: Service Scaffold -- DONE

- Built `EASIBridge.exe` (C# 5, .NET 4.8, compiled with framework `csc.exe`)
- Dual-mode: `--console` for testing, Windows Service for production
- Heartbeat every 30s, file logging, health.json, Event Log
- Anti-double-instance via Global\EASIBridgeMutex
- No AutoCount logic in this phase
- Script: `bridge/EASIBridge/phase1-setup.ps1` (builds + smoke tests)
- Rollback: `bridge/EASIBridge/phase1-rollback.ps1`

### Phase 2: Windows Service Install -- DONE

- Registered via `sc.exe create` as `EASIBridge`
- Display name: "EASI AutoCount Bridge"
- Initially Manual start, LocalSystem
- Script: `bridge/EASIBridge/phase2-install-service.ps1`
- Rollback: `bridge/EASIBridge/phase2-rollback.ps1`

### Phase 3: Recovery + Startup -- DONE

- Startup type: Automatic (Delayed Start)
- Failure recovery: restart after 10s / 30s / 60s
- Failure counter resets after 24 hours

### Phase 4: Logging/Observability -- DONE

- File logs: `C:\ProgramData\EASI\Bridge\logs\bridge-YYYY-MM-DD.log`
- Health file: `C:\ProgramData\EASI\Bridge\status\health.json`
- Windows Event Log: Application log, source `EASIBridge`
- Log rotation: manual (recommended 90-day cleanup, not auto-configured)

### Phase 5: Smoke Test as Service -- DONE

- Service started/stopped/restarted cleanly
- Heartbeats confirmed in file log and Event Log
- Health.json updated to "running" / "stopped" on lifecycle events
- Memory footprint: ~20 MB
- Script: `bridge/EASIBridge/phase345-configure-and-smoke.ps1` (combined 3+4+5)

### Phase 6: Hardening -- DONE (with fixes)

- Created `svc_easibridge` local account (not in Administrators)
- Password: `EasiBridge2026!Svc` (reset via phase6-fix.ps1 after original was mangled)
- "Log on as a service" granted via LSA P/Invoke API (secedit approach failed silently)
- File ACLs locked down:
  - `C:\EASI\Bridge\` -- svc_easibridge = ReadAndExecute
  - `C:\ProgramData\EASI\Bridge\logs\` -- svc_easibridge = Modify
  - `C:\ProgramData\EASI\Bridge\config\` -- svc_easibridge = ReadAndExecute
  - `C:\ProgramData\EASI\Bridge\status\` -- svc_easibridge = Modify
- SYSTEM + Administrators = FullControl everywhere
- Service running under `.\svc_easibridge`
- Scripts: `phase6-harden.ps1`, `phase6-diagnose.ps1`, `phase6-fix.ps1`

### AutoCount SDK Read-Only Connection -- DONE

- `AutoCountConnector.cs` added -- loads SDK via reflection from install path
- Assembly resolver in `Program.cs` Main() resolves AC DLLs at runtime
- `BridgeService.cs` tests AC connection on startup (gated by `AutoCountEnabled` config)
- Connection flow: `DBSetting(SQL2000, server, db)` -> `UserSession.Login(user, pass)`
- Query via `dbSetting.GetDataTable(sql, false, params)` and `ExecuteScalar(sql, params)`
- Tested in console mode as `User` -- login successful, 401 debtors in AED_EPICO
- Graceful disconnect on service shutdown (Logout + Dispose)
- Build script updated: `phase1-setup.ps1` now includes `System.Data.dll` + `AutoCount.dll` refs

### Service-Mode AutoCount Connection (SQL Auth option) -- DONE

- **Code:** Optional SQL Server authentication for DB connection when service runs as `svc_easibridge` (no Windows login to SQL).
- Config: `AutoCountUseSqlAuth` (true/false), `AutoCountSqlUser`, `AutoCountSqlPassword` in `BridgeConfig.cs` and `App.config`.
- When `AutoCountUseSqlAuth=true` and SQL user/password set, connector uses `DBSetting(SQL2000, server, sqlUser, sqlPass, dbName)`; otherwise uses Windows Auth (3-arg constructor).
- AutoCount app login (EASIBRIDG / easi123\*) unchanged; only the underlying SQL connection method is switchable.
- `App.config` now configured with `AutoCountUseSqlAuth=true`, `AutoCountSqlUser=sa`, `AutoCountSqlPassword` set.
- **On server:** Rebuild (`phase1-setup.ps1`), restart EASIBridge service, verify AC connection in service logs.

### One-time: Extract DMF credentials -- DONE

- Script: `bridge/EASIBridge/ExtractDmfCredentials.cs` + `extract-dmf-credentials.ps1`.
- Ran on Epico PC; extracted SA credentials from AutoCount DMF config via SDK.
- **SQL Server SA:** user `sa`, password `oCt2005-ShenZhou6_A2006`, server `(local)\A2006`.
- Same SA password for all 5 company databases (AED_EPICO, AED_NATIVIS, AED_THEORGANIC, AED_THEWINERY, AED_Winery).
- DMF file stores encrypted passwords; SDK decrypts at runtime.
- `ExtractDmfCredentials.exe` on Epico PC can be deleted (one-time use).

---

## KNOWN ISSUES / TECH DEBT

### Service account SQL access -- RESOLVED

- Using SQL Auth with `sa` credentials extracted from DMF.
- `App.config` has `AutoCountUseSqlAuth=true`, `AutoCountSqlUser=sa`, `AutoCountSqlPassword` set.
- Future improvement: create a dedicated SQL login with limited permissions instead of using `sa`.

### PowerShell script encoding

- Box-drawing Unicode characters get garbled during AnyDesk file transfer
- Solution: use ASCII-only characters and single quotes in all PS1 scripts
- Double-quoted strings with `()` cause PowerShell parse errors -- always use single quotes for static text

### AutoCount.Accounting.dll dependency issue

- Cannot fully reflect `AutoCount.Accounting.dll` -- needs `Microsoft.Bcl.AsyncInterfaces` 1.0.0
- Not a blocker: all needed types (DBSetting, UserSession) are in `AutoCount.dll`
- May need to resolve this when accessing Accounting-specific modules (AR Invoice, etc.)

---

## ENVIRONMENT REFERENCE

### Server

- Machine: `DESKTOP-20COQHQ`
- OS: Windows 10 Pro
- .NET: 4.8.1 (release 533325)
- MSBuild: `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe`
- Admin user: `User`

### AutoCount

- Version: 2.1
- Install path: `C:\Program Files\AutoCount\Accounting 2.1` (126 DLLs)
- API Module: Enabled
- Config: `C:\ProgramData\AutoCount\Accounting 2\A2006.config` -> `A2006.dmf`
- AOTG also running (ASP.NET Core endpoints visible in Event Viewer)

### SQL Server

- Instance: `DESKTOP-20COQHQ\A2006` (MSSQL16 = SQL Server 2022)
- Auth: Windows Authentication works from `User` account
- Databases with AutoCount tables:
  - `AED_EPICO` (401 debtors) -- **configured as primary**
  - `AED_NATIVIS` (55 debtors)
  - `AED_THEORGANIC` (39 debtors)
  - `AED_THEWINERY` (11 debtors)
  - `AED_Winery` (37 debtors)

### AutoCount SDK API (discovered via reflection)

- All key types in `AutoCount.dll` (no separate Data/Auth DLLs)
- `AutoCount.Data.DBSetting` -- connection + query methods
  - Constructors: `(DBServerType, serverName, dbName)` for WinAuth, `(DBServerType, serverName, userId, password, dbName)` for SQL Auth
  - `GetDataTable(sql, loadSchema, params)` -- returns DataTable
  - `ExecuteScalar(sql, params)` -- returns scalar
  - `CreateCommand()` -- returns IDbCommand
  - Static: `CreateAutoCountDefaultDBSetting(serverName, dbName)`
- `AutoCount.Data.DBServerType` enum: `SQL2000`, `Postgres`
- `AutoCount.Authentication.UserSession` -- session management
  - Constructor: `(DBSetting)`
  - `Login(userID, password)` -> bool
  - `Logout()` -> bool
  - `IsLogin` property
  - `LoginUserID` property
  - `DBSetting` property
  - `AccessRight` property
- `AutoCount.Configuration.DatabaseManagement` -- loads DMF config
  - `LoadDefaultDMF()` -- loads from standard path
  - `DatabaseManager` property -> iterate `GetDatabaseInfo(index)`
  - `DatabaseInfo` has: ServerName, DatabaseName, SAName, SAPassword, CompanyName

### Credentials

- AutoCount user: `EASIBRIDG` / `easi123*` (INTEGRATION group)
- SQL Server SA: `sa` / `oCt2005-ShenZhou6_A2006` (same for all 5 company DBs)
- Service account: `svc_easibridge` / `EasiBridge2026!Svc` (Log on as service)
- Supabase project: `vqxnkxaeriizizfmqvua` (see CLAUDE.md for full keys)

### Bridge File Locations

**On server (`DESKTOP-20COQHQ`):**

- Binary: `C:\EASI\Bridge\EASIBridge.exe`
- Config: `C:\EASI\Bridge\EASIBridge.exe.config`
- Logs: `C:\ProgramData\EASI\Bridge\logs\`
- Health: `C:\ProgramData\EASI\Bridge\status\health.json`

**In project (source):**

- `bridge/EASIBridge/` -- all .cs source files + .ps1 scripts + App.config

### Source Files

| File                       | Lines | Purpose                                                                        |
| -------------------------- | ----- | ------------------------------------------------------------------------------ |
| `Program.cs`               | ~65   | Entry point, TLS 1.2, assembly resolver, dual-mode (console/service)           |
| `BridgeService.cs`         | ~195  | Windows Service, heartbeat timer, sync timer, AC connection, graceful shutdown |
| `BridgeLogger.cs`          | 113   | File + Event Log writer, daily log files, thread-safe                          |
| `HealthWriter.cs`          | 90    | Atomic JSON health file writer                                                 |
| `BridgeConfig.cs`          | ~120  | AppSettings reader (SQL Auth, Supabase, sync interval settings)                |
| `AutoCountConnector.cs`    | ~280  | SDK loader via reflection, connect/disconnect/query (incl. QueryAllDebtors)    |
| `SupabaseClient.cs`        | ~110  | HTTP client for Supabase REST API (insert, upsert, update, select)             |
| `DebtorSyncService.cs`     | ~290  | Debtor-to-company sync: query AC, map fields, upsert to Supabase               |
| `ExtractDmfCredentials.cs` | ~300  | One-time console app: load DMF via SDK, print ServerName/DB/SAName/SAPassword  |
| `AssemblyInfo.cs`          | 11    | Assembly metadata v0.1.0.0                                                     |
| `App.config`               | ~27   | All config (AC, SQL Auth, Supabase, debtor sync interval)                      |

### Setup/Deploy Scripts

| Script                             | Admin? | Purpose                                                              |
| ---------------------------------- | ------ | -------------------------------------------------------------------- |
| `phase1-setup.ps1`                 | No     | Build all .cs files + deploy to `C:\EASI\Bridge\`                    |
| `phase1-rollback.ps1`              | No     | Remove all bridge files and directories                              |
| `phase2-install-service.ps1`       | Yes    | Register Windows Service via sc.exe                                  |
| `phase2-rollback.ps1`              | Yes    | Remove Windows Service registration                                  |
| `phase345-configure-and-smoke.ps1` | Yes    | Recovery config + Event Log + full service smoke test                |
| `phase6-harden.ps1`                | Yes    | Create svc_easibridge, ACLs, switch service logon                    |
| `phase6-fix.ps1`                   | Yes    | Fix "Log on as service" right via LSA API + reset password           |
| `phase6-diagnose.ps1`              | Yes    | Diagnose service start failures from Event Viewer                    |
| `extract-dmf-credentials.ps1`      | No     | One-time: build and run DMF credential extractor (Epico PC)          |
| `ac-schema-discover.ps1`           | No     | Dump column names/types for key AC tables -> ac-schema-reference.txt |
| `ac-discover.ps1`                  | No     | Reflect AutoCount DLLs, discover SDK API surface                     |
| `ac-discover2.ps1`                 | No     | Read AC config, list SQL databases, find AC tables                   |

---

## NEXT STEPS

### 1. Verify service-mode AutoCount connection -- DONE

- SQL Auth configured in `App.config` (sa / oCt2005-ShenZhou6_A2006).
- Rebuilt and deployed on server. Service running as `svc_easibridge` with SQL Auth.
- Confirmed: `sqlAuth=True`, `DBSetting created (SQL Auth)`, login successful, 401 debtors, heartbeats OK.

### 2. Create sync infrastructure tables in Supabase -- DONE

- Migration: `supabase/migrations/20260305100000_create_sync_infrastructure.sql`
- `sync_jobs` table: id, job_type, status (pending/running/completed/failed), started_at, completed_at, records_processed/synced/failed, error_message, metadata (JSONB)
- `sync_errors` table: id, job_id (FK), entity, record_key, error_message, error_detail, retry_count, resolved
- `autocount_debtor_code` column added to `companies` (unique index, nullable) for debtor mapping
- RLS enabled on sync tables with no user-facing policies (service_role only)
- `updated_at` trigger on sync_jobs
- 11 older unapplied migrations marked as applied via `supabase migration repair`
- CLI re-linked to correct project `vqxnkxaeriizizfmqvua` (was pointing to wrong project)

### 3. Debtor-to-company sync (one-way read) -- DONE

- **Result:** 401 total, 401 synced, 0 failed. Running on Epico PC as service.
- **New source files:** `SupabaseClient.cs`, `DebtorSyncService.cs`
- **Modified:** `AutoCountConnector.cs` (added `QueryAllDebtors` with `SELECT *`), `BridgeService.cs` (sync timer), `BridgeConfig.cs` (sync config + debtor sync settings), `App.config` (Supabase creds + sync settings), `phase1-setup.ps1` (new .cs files), `Program.cs` (TLS 1.2 fix)
- **Field mapping:** AccNo -> autocount_debtor_code, CompanyName -> name/company_name, Address1-4 -> address, Phone1 -> phone, EmailAddress -> email, UEN always "AC-{AccNo}" (RegisterNo unreliable: duplicates and dashes), CreditLimit -> credit_limit, DisplayTerm -> payment_terms (COD/NET7/NET30/NET60), IsActive -> status
- **Upsert logic:** PostgREST upsert on `autocount_debtor_code` unique constraint (fixed from index to constraint via migration `20260305110000`)
- **Sync job tracking:** Creates `sync_jobs` row per run, logs per-record errors to `sync_errors`
- **Timer:** configurable via `DebtorSyncIntervalMinutes` (default 60); first run 15s after startup; guard prevents overlapping runs
- **Issues resolved during implementation:**
  - TLS 1.2: .NET 4.8 defaults to TLS 1.0; added `ServicePointManager.SecurityProtocol = Tls12` in Program.cs
  - Column names: original query used wrong names (FaxNo, Contact, CreditTerm, DebtorTypeCode, BRNo); switched to `SELECT *` with defensive column access
  - UEN conflicts: RegisterNo has duplicates (same company, multiple debtor accounts) and dashes ("-" as placeholder); switched to always use `AC-{AccNo}` as UEN
  - PostgREST on_conflict: requires UNIQUE CONSTRAINT not UNIQUE INDEX; fixed via migration
- **Debtor table:** 82 columns discovered; full reference in `docs/autocount-debtor-columns.md`
- **Still no posting back to AutoCount**

### 3a. Harden debtor sync (data quality)

- [ ] Empty `CompanyName`: fall back to AccNo or "Unknown" (Supabase `name` is NOT NULL)
- [ ] Special characters / control chars in company names: audit and sanitize beyond basic JSON escaping
- [ ] `payment_terms` mapping gaps: NET14, NET45, NET90 etc. all map to COD currently; decide if new terms needed
- [ ] `credit_limit` precision: Supabase DECIMAL(10,2) could overflow for very large accounts
- [ ] `phone` length: Supabase VARCHAR(20) could truncate long phone strings with extensions
- [ ] Duplicate companies: existing 7 Supabase companies without `autocount_debtor_code` may overlap with synced debtors; consider manual mapping or dedup
- [ ] `sync_jobs`/`sync_errors` table growth: add cleanup or retention policy for old job/error rows
- [ ] `SELECT *` performance: fine for 401 rows but could be slow at scale; consider explicit column list once schema is stable
- [ ] Network resilience: no per-record retry for transient Supabase failures; entire debtor retried on next 60-min cycle
- [ ] Run `ac-schema-discover.ps1` on Epico PC and save output as permanent reference

### 4. Build posting contract and state machine

- Define trigger conditions: `invoice_ready`, `payment_recorded`
- Status flow: `pending` -> `posting` -> `posted` / `failed` -> `manual_review`
- Retry rules: transient errors (network, timeout) vs business errors (validation)
- Queue table with single-worker lock to prevent double-posting

### 5. Implement AR Invoice posting

- Transform app order data to AutoCount AR Invoice format
- Call AutoCount SDK to create AR Invoice (using ARAP module)
- Persist external doc refs and error snapshots
- Idempotency: prevent duplicate posting via unique external keys

### 6. Implement AR Payment posting

- Link payments to posted invoices
- Handle partial payments, overpayments
- Same state machine and retry logic as invoices

### 7. Reconciliation

- Daily reconciliation: app totals vs AutoCount posted totals
- Manual requeue flow for failed records
- Alerting for discrepancies

### 8. Monitoring and alerting

- Health endpoint for external monitoring
- Failure alerts (email/Teams) for queue backlog and repeated errors
- Dashboard for sync latency and success rate

### 9. UAT and controlled rollout

- Test in non-production account book first (use AED_THEWINERY with 11 debtors)
- Test matrix: success, duplicate, partial payment, missing mapping, network failure
- Go-live plan with rollback and freeze window

### 10. Documentation and handover

- Ops runbook (start/stop/restart/recovery)
- Support playbook (common errors + fixes)
- Change management log and ownership assignments
