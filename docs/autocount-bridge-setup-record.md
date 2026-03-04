# EASI AutoCount Bridge -- Setup Record

**Date:** 2026-03-04
**Server:** DESKTOP-20COQHQ (Windows 10 Pro)
**AutoCount:** 2.1 (installed at `C:\Program Files\AutoCount\Accounting 2.1`)
**SQL Server:** MSSQL16.A2006 (SQL Server 2022, instance name `A2006`)
**.NET Framework:** 4.8.1 (release 533325)

## Service Summary

| Property       | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Service Name   | `EASIBridge`                                           |
| Display Name   | EASI AutoCount Bridge                                  |
| Binary Path    | `C:\EASI\Bridge\EASIBridge.exe`                        |
| Config Path    | `C:\EASI\Bridge\EASIBridge.exe.config`                 |
| Run-As Account | `.\svc_easibridge`                                     |
| Startup Type   | Automatic (Delayed Start)                              |
| Recovery       | Restart after 10s / 30s / 60s; reset counter after 24h |
| Current State  | Running (heartbeat skeleton, no AutoCount posting)     |

## Directory Layout

| Path                                 | Purpose                                   | svc_easibridge ACL |
| ------------------------------------ | ----------------------------------------- | ------------------ |
| `C:\EASI\Bridge\`                    | Service binaries + config                 | ReadAndExecute     |
| `C:\ProgramData\EASI\Bridge\logs\`   | Daily log files (`bridge-YYYY-MM-DD.log`) | Modify             |
| `C:\ProgramData\EASI\Bridge\config\` | Future external config                    | ReadAndExecute     |
| `C:\ProgramData\EASI\Bridge\status\` | `health.json` status file                 | Modify             |

SYSTEM and Administrators have FullControl on all directories.

## Source Code

Bridge source lives in the project at `bridge/EASIBridge/`:

| File               | Purpose                                                                             |
| ------------------ | ----------------------------------------------------------------------------------- |
| `Program.cs`       | Entry point (dual-mode: `--console` for testing, service mode for production)       |
| `BridgeService.cs` | Windows Service class with heartbeat timer + graceful shutdown                      |
| `BridgeLogger.cs`  | File logging (daily rotation) + Windows Event Log (Application source `EASIBridge`) |
| `HealthWriter.cs`  | Atomic JSON health status writer                                                    |
| `BridgeConfig.cs`  | Config reader (`App.config` appSettings)                                            |
| `AssemblyInfo.cs`  | Assembly metadata (v0.1.0.0)                                                        |
| `App.config`       | Configuration with secret placeholders                                              |

## Build Process

Compiled with .NET Framework `csc.exe` (no Visual Studio required):

```powershell
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /nologo /target:exe /platform:anycpu `
    /out:C:\EASI\Bridge\EASIBridge.exe `
    /reference:System.dll /reference:System.Configuration.dll /reference:System.ServiceProcess.dll `
    Program.cs BridgeService.cs BridgeLogger.cs HealthWriter.cs BridgeConfig.cs AssemblyInfo.cs
```

## Service Account

- **Username:** `svc_easibridge`
- **Password:** Stored separately (password manager) -- reset to known value on 2026-03-04
- **Privileges:** "Log on as a service" (granted via LSA API)
- **Not a member of:** Administrators or any elevated group
- **Password policy:** Never expires (rotate manually)

## Safety Constraints (Current Phase)

- NO AutoCount SDK references compiled in
- NO database connections attempted
- NO financial documents created, edited, or posted
- NO production data touched
- Heartbeat only (every 30 seconds)

## Observability

- **File logs:** `C:\ProgramData\EASI\Bridge\logs\bridge-YYYY-MM-DD.log`
- **Health status:** `C:\ProgramData\EASI\Bridge\status\health.json`
- **Windows Event Log:** Application log, source `EASIBridge`
- **Log rotation:** Manual (recommended: 90-day cleanup via Scheduled Task)

## Notable Discovery

AutoCount AOTG (API on the Go) appears to be running on this server. Event Viewer showed
ASP.NET Core endpoints for `/api/debtor/getdebtor`, `/api/debtor/getdebtorhistorical`,
and `/api/debtor/getdebtorcreditinfo`. This may be useful for future integration
if direct SDK access proves insufficient.

## Rollback Scripts

| Script                | Purpose                             |
| --------------------- | ----------------------------------- |
| `phase1-rollback.ps1` | Remove binaries + data directories  |
| `phase2-rollback.ps1` | Remove Windows Service registration |

Full rollback order: Phase 2 rollback (remove service), then Phase 1 rollback (remove files).

## AutoCount SDK Connection (Completed 2026-03-04)

**Status:** Read-only connection verified and working.

| Property        | Value                                                     |
| --------------- | --------------------------------------------------------- |
| SDK DLL         | `C:\Program Files\AutoCount\Accounting 2.1\AutoCount.dll` |
| DBServerType    | `SQL2000` (AutoCount enum for all SQL Server versions)    |
| SQL Instance    | `DESKTOP-20COQHQ\A2006` (SQL Server 2022)                 |
| Database        | `AED_EPICO` (401 debtors, main company DB)                |
| AC User         | `EASIBRIDG` (INTEGRATION group)                           |
| SQL Auth        | Windows Authentication (Integrated Security)              |
| Connection Time | ~600ms                                                    |

**All databases on this instance:**

| Database         | Debtors | Notes                |
| ---------------- | ------- | -------------------- |
| `AED_EPICO`      | 401     | Primary (configured) |
| `AED_NATIVIS`    | 55      |                      |
| `AED_THEORGANIC` | 39      |                      |
| `AED_THEWINERY`  | 11      |                      |
| `AED_Winery`     | 37      |                      |

**Source files added:**

| File                    | Purpose                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `AutoCountConnector.cs` | SDK loader + connection + read-only queries (via reflection) |

**Config keys added:**

| Key                 | Value                            |
| ------------------- | -------------------------------- |
| `AutoCountEnabled`  | `true` / `false` - master switch |
| `AutoCountUserId`   | AutoCount application user       |
| `AutoCountPassword` | AutoCount application password   |

**Safety constraints still in effect:**

- NO documents created, edited, or posted
- Read-only queries only (SELECT)
- Service continues in degraded mode if AC connection fails
- Graceful disconnect on service shutdown

## Next Milestone

Debtor sync to Supabase:

1. Map AutoCount Debtor fields to app `companies` table
2. One-way read: pull debtors from AutoCount, push to Supabase
3. Incremental sync (detect changes since last sync)
4. Still no posting back to AutoCount
