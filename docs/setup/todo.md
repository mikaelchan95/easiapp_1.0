# EASI AutoCount Bridge -- Master TODO & Session Continuity

**Last updated:** 2026-03-04
**Reference docs:**

- `docs/autocount-bridge-setup-record.md` -- full setup record with all credentials, paths, configs
- `docs/autocount-integration-rights-snapshot.md` -- AutoCount access rights for INTEGRATION group
- `docs/autocount-user-to-app-schema-mapping.md` -- field mapping between AutoCount and app schema

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

---

## KNOWN ISSUES / TECH DEBT

### Service account SQL access (not yet tested)

- Console test ran as `User` (has SQL access via Windows Auth)
- Service runs as `svc_easibridge` which may NOT have SQL Server access
- **To fix:** Either grant `svc_easibridge` a login on the `A2006` SQL instance, or switch DBSetting to SQL Auth constructor: `DBSetting(SQL2000, server, sqlUser, sqlPass, dbName)`
- The `DatabaseManagement` class can load the DMF file to get SA credentials if needed

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

| File                    | Lines | Purpose                                                                       |
| ----------------------- | ----- | ----------------------------------------------------------------------------- |
| `Program.cs`            | 61    | Entry point, assembly resolver setup, dual-mode (console/service)             |
| `BridgeService.cs`      | 156   | Windows Service, heartbeat timer, AC connection on startup, graceful shutdown |
| `BridgeLogger.cs`       | 113   | File + Event Log writer, daily log files, thread-safe                         |
| `HealthWriter.cs`       | 90    | Atomic JSON health file writer                                                |
| `BridgeConfig.cs`       | 84    | AppSettings reader for all config keys                                        |
| `AutoCountConnector.cs` | ~230  | SDK loader via reflection, connect/disconnect/query                           |
| `AssemblyInfo.cs`       | 11    | Assembly metadata v0.1.0.0                                                    |
| `App.config`            | 19    | All config with actual values (AC password = `easi123*`)                      |

### Setup/Deploy Scripts

| Script                             | Admin? | Purpose                                                    |
| ---------------------------------- | ------ | ---------------------------------------------------------- |
| `phase1-setup.ps1`                 | No     | Build all .cs files + deploy to `C:\EASI\Bridge\`          |
| `phase1-rollback.ps1`              | No     | Remove all bridge files and directories                    |
| `phase2-install-service.ps1`       | Yes    | Register Windows Service via sc.exe                        |
| `phase2-rollback.ps1`              | Yes    | Remove Windows Service registration                        |
| `phase345-configure-and-smoke.ps1` | Yes    | Recovery config + Event Log + full service smoke test      |
| `phase6-harden.ps1`                | Yes    | Create svc_easibridge, ACLs, switch service logon          |
| `phase6-fix.ps1`                   | Yes    | Fix "Log on as service" right via LSA API + reset password |
| `phase6-diagnose.ps1`              | Yes    | Diagnose service start failures from Event Viewer          |
| `ac-discover.ps1`                  | No     | Reflect AutoCount DLLs, discover SDK API surface           |
| `ac-discover2.ps1`                 | No     | Read AC config, list SQL databases, find AC tables         |

---

## NEXT STEPS (NOT STARTED)

### 1. Fix service-mode AutoCount connection

- Grant `svc_easibridge` SQL Server login on `A2006` instance, OR
- Switch to SQL Auth using SA credentials from DMF file
- Rebuild, restart service, verify AC connection in service logs
- **This must be done before any sync work**

### 2. Create sync infrastructure tables in Supabase

- `sync_jobs` table: job_id, type, status, started_at, completed_at, records_synced, error
- `sync_errors` table: error_id, job_id, entity, record_key, error_message, retry_count
- Status enum: pending, running, completed, failed
- Migration file in `supabase/migrations/`

### 3. Debtor-to-company sync (one-way read)

- Map AutoCount `Debtor` fields to app `companies` table
- Key fields: AccNo -> debtor_code, CompanyName -> name, address, phone, etc.
- Create `autocount_debtor_code` column in companies table (or mapping table)
- Pull debtors from AutoCount, upsert to Supabase
- Incremental sync: detect changes since last sync (use LastModified or hash comparison)
- **Still no posting back to AutoCount**

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
