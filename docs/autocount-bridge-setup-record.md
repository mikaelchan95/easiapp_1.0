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

## Next Milestone

AutoCount SDK read-only connection test:

1. Reference AutoCount DLLs from `C:\Program Files\AutoCount\Accounting 2.1`
2. Open a read-only session to the `A2006` database
3. Query a non-financial entity (e.g., debtor list or company info)
4. Confirm connection without creating/modifying any records
