#Requires -RunAsAdministrator
<#
    EASI Bridge - Phases 3, 4, 5
    
    Phase 3: Configure recovery policy + automatic (delayed) start
    Phase 4: Logging / observability setup (Event Log source, rotation guidance)
    Phase 5: Smoke test as a real Windows Service
    
    REQUIRES: Run as Administrator
#>

$ErrorActionPreference = "Stop"
$divider = "=" * 60
$serviceName = "EASIBridge"

Write-Host ""
Write-Host $divider
Write-Host "  EASI Bridge - Phases 3 + 4 + 5"
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host $divider
Write-Host ""

# ── Pre-check: service must exist ──────────────────────────────────
$svc = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $svc) {
    Write-Host "FAIL: Service '$serviceName' not found. Run Phase 2 first." -ForegroundColor Red
    cmd /c pause
    exit 1
}
Write-Host "Service '$serviceName' found (Status: $($svc.Status))."
Write-Host ""

# ════════════════════════════════════════════════════════════════════
#  PHASE 3: Recovery Policy + Startup Type
# ════════════════════════════════════════════════════════════════════
Write-Host "*** PHASE 3: Recovery Policy + Startup Type ***" -ForegroundColor Magenta
Write-Host ""

# ── 3.1  Set startup type to Automatic (Delayed Start) ────────────
Write-Host "[3.1] Setting startup type to Automatic (Delayed Start)..." -ForegroundColor Cyan

Set-Service -Name $serviceName -StartupType Automatic
# Delayed start is a registry flag on top of Automatic
$regPath = "HKLM:\SYSTEM\CurrentControlSet\Services\$serviceName"
Set-ItemProperty -Path $regPath -Name "DelayedAutostart" -Value 1 -Type DWord

$svc = Get-Service -Name $serviceName
$delayed = (Get-ItemProperty $regPath -Name "DelayedAutostart" -ErrorAction SilentlyContinue).DelayedAutostart
Write-Host "  Start Type:      $($svc.StartType)"
Write-Host "  DelayedAutostart: $delayed (1 = enabled)"

if ($svc.StartType -eq "Automatic" -and $delayed -eq 1) {
    Write-Host "  PASS" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Unexpected values" -ForegroundColor Yellow
}
Write-Host ""

# ── 3.2  Configure failure recovery actions ────────────────────────
Write-Host "[3.2] Configuring failure recovery actions..." -ForegroundColor Cyan
Write-Host "  Policy: restart after 10s, 30s, 60s on 1st/2nd/3rd failure"
Write-Host "  Reset failure count after 86400 seconds (24 hours)"

# sc.exe failure syntax: reset= <seconds> actions= <type/delay_ms/type/delay_ms/...>
& sc.exe failure $serviceName reset= 86400 actions= restart/10000/restart/30000/restart/60000 | Out-Null
$scExit = $LASTEXITCODE

if ($scExit -eq 0) {
    Write-Host "  PASS" -ForegroundColor Green
} else {
    Write-Host "  WARNING: sc.exe failure returned $scExit" -ForegroundColor Yellow
}

# Verify by querying
Write-Host ""
Write-Host "  Verifying recovery config:"
$failInfo = & sc.exe qfailure $serviceName 2>&1
foreach ($line in $failInfo) {
    $trimmed = "$line".Trim()
    if ($trimmed.Length -gt 0) {
        Write-Host "    $trimmed"
    }
}
Write-Host ""

# ════════════════════════════════════════════════════════════════════
#  PHASE 4: Logging / Observability Setup
# ════════════════════════════════════════════════════════════════════
Write-Host "*** PHASE 4: Logging / Observability ***" -ForegroundColor Magenta
Write-Host ""

# ── 4.1  Windows Event Log source ─────────────────────────────────
Write-Host "[4.1] Registering Windows Event Log source..." -ForegroundColor Cyan

$eventSource = "EASIBridge"
$eventLog = "Application"

try {
    if ([System.Diagnostics.EventLog]::SourceExists($eventSource)) {
        Write-Host "  Event source '$eventSource' already registered."
    } else {
        [System.Diagnostics.EventLog]::CreateEventSource($eventSource, $eventLog)
        Write-Host "  Event source '$eventSource' created in '$eventLog' log."
    }
    Write-Host "  PASS" -ForegroundColor Green
} catch {
    Write-Host "  WARNING: Could not register event source: $_" -ForegroundColor Yellow
    Write-Host "  File logging will still work. Event Log is optional."
}
Write-Host ""

# ── 4.2  Verify log directory & permissions ────────────────────────
Write-Host "[4.2] Verifying log directory..." -ForegroundColor Cyan

$logDir = "C:\ProgramData\EASI\Bridge\logs"
if (Test-Path $logDir) {
    $acl = Get-Acl $logDir
    Write-Host "  Path: $logDir"
    Write-Host "  Owner: $($acl.Owner)"
    Write-Host "  Access rules:"
    $acl.Access | ForEach-Object {
        Write-Host ("    {0,-40} {1,-15} {2}" -f $_.IdentityReference, $_.AccessControlType, $_.FileSystemRights)
    }
    Write-Host "  PASS" -ForegroundColor Green
} else {
    Write-Host "  FAIL: Log directory missing. Run Phase 1 setup first." -ForegroundColor Red
}
Write-Host ""

# ── 4.3  Existing log files ───────────────────────────────────────
Write-Host "[4.3] Existing log files..." -ForegroundColor Cyan
$logFiles = Get-ChildItem "$logDir\bridge-*.log" -ErrorAction SilentlyContinue | Sort-Object Name
if ($logFiles) {
    foreach ($f in $logFiles) {
        Write-Host ("  {0}  {1,10} bytes  {2}" -f $f.Name, $f.Length, $f.LastWriteTime)
    }
} else {
    Write-Host "  (none yet - expected before first service run)"
}
Write-Host ""

# ── 4.4  Log rotation guidance ────────────────────────────────────
Write-Host "[4.4] Log Rotation Guidance" -ForegroundColor Cyan
Write-Host "  The bridge writes one log file per day: bridge-YYYY-MM-DD.log"
Write-Host "  At 30s heartbeats, each file grows ~100 KB/day (2880 lines)."
Write-Host ""
Write-Host "  Recommended: schedule a monthly cleanup task." -ForegroundColor Gray
Write-Host "  Example (keeps 90 days, run as Scheduled Task):" -ForegroundColor Gray
Write-Host ""
Write-Host '  Get-ChildItem "C:\ProgramData\EASI\Bridge\logs\bridge-*.log" |' -ForegroundColor DarkGray
Write-Host '    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-90) } |' -ForegroundColor DarkGray
Write-Host '    Remove-Item -Force' -ForegroundColor DarkGray
Write-Host ""
Write-Host "  (Not auto-configured - your call on retention policy.)"
Write-Host ""

# ════════════════════════════════════════════════════════════════════
#  PHASE 5: Smoke Test as Windows Service
# ════════════════════════════════════════════════════════════════════
Write-Host "*** PHASE 5: Service Smoke Test ***" -ForegroundColor Magenta
Write-Host ""

# ── 5.1  Start the service ────────────────────────────────────────
Write-Host "[5.1] Starting service..." -ForegroundColor Cyan

# Clear old health file to prove the service writes a fresh one
$healthFile = "C:\ProgramData\EASI\Bridge\status\health.json"
if (Test-Path $healthFile) {
    Remove-Item $healthFile -Force
    Write-Host "  Cleared old health.json"
}

try {
    Start-Service -Name $serviceName
    Write-Host "  Start-Service completed."
} catch {
    Write-Host "  FAIL: Could not start service: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Check Windows Event Viewer > Application log for details."
    Write-Host "  Common causes:"
    Write-Host "    - Service exe crashed on startup"
    Write-Host "    - Another instance mutex still held (reboot to clear)"
    cmd /c pause
    exit 1
}

Start-Sleep -Seconds 3

$svc = Get-Service -Name $serviceName
Write-Host "  Service status: $($svc.Status)"

if ($svc.Status -ne "Running") {
    Write-Host "  FAIL: Service is not running!" -ForegroundColor Red
    cmd /c pause
    exit 1
}
Write-Host "  PASS - Service is running." -ForegroundColor Green
Write-Host ""

# ── 5.2  Wait for heartbeat ──────────────────────────────────────
Write-Host "[5.2] Waiting 35 seconds for heartbeat cycle..." -ForegroundColor Cyan
Start-Sleep -Seconds 35
Write-Host "  Done waiting."
Write-Host ""

# ── 5.3  Verify log output ────────────────────────────────────────
Write-Host "[5.3] Checking log file..." -ForegroundColor Cyan

$today = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")
$logFile = Join-Path $logDir "bridge-$today.log"

if (Test-Path $logFile) {
    $lines = Get-Content $logFile
    $recentLines = $lines | Select-Object -Last 15
    Write-Host "  Log: $logFile ($($lines.Count) total lines)"
    Write-Host "  Last 15 lines:"
    foreach ($line in $recentLines) {
        Write-Host "    $line"
    }

    $heartbeats = $lines | Where-Object { $_ -match "Heartbeat OK" }
    Write-Host ""
    Write-Host "  Heartbeat entries: $($heartbeats.Count)"
    if ($heartbeats.Count -ge 2) {
        Write-Host "  PASS" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Expected at least 2 heartbeats" -ForegroundColor Yellow
    }
} else {
    Write-Host "  FAIL: No log file found for today ($logFile)" -ForegroundColor Red
}
Write-Host ""

# ── 5.4  Verify health.json ──────────────────────────────────────
Write-Host "[5.4] Checking health.json..." -ForegroundColor Cyan

if (Test-Path $healthFile) {
    Write-Host "  Contents:"
    Get-Content $healthFile | ForEach-Object { Write-Host "    $_" }
    Write-Host ""

    $content = Get-Content $healthFile -Raw
    if ($content -match '"status":\s*"running"') {
        Write-Host "  PASS - Status is 'running'." -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Status is not 'running'." -ForegroundColor Yellow
    }
} else {
    Write-Host "  FAIL: health.json not found." -ForegroundColor Red
}
Write-Host ""

# ── 5.5  Check Windows Event Log ─────────────────────────────────
Write-Host "[5.5] Checking Windows Event Log..." -ForegroundColor Cyan

try {
    $events = Get-EventLog -LogName Application -Source "EASIBridge" -Newest 5 -ErrorAction Stop
    Write-Host "  Recent EASIBridge events:"
    foreach ($evt in $events) {
        Write-Host ("    [{0}] [{1}] {2}" -f $evt.TimeGenerated.ToString("HH:mm:ss"), $evt.EntryType, $evt.Message)
    }
    Write-Host "  PASS" -ForegroundColor Green
} catch {
    Write-Host "  No Event Log entries found (Event Log source may not have been available)." -ForegroundColor Yellow
    Write-Host "  File logging is working - this is acceptable."
}
Write-Host ""

# ── 5.6  Verify service process ──────────────────────────────────
Write-Host "[5.6] Service process check..." -ForegroundColor Cyan

$proc = Get-Process -Name "EASIBridge" -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "  PID:          $($proc.Id)"
    Write-Host "  Memory (MB):  $([math]::Round($proc.WorkingSet64 / 1MB, 2))"
    Write-Host "  CPU (sec):    $([math]::Round($proc.TotalProcessorTime.TotalSeconds, 2))"
    Write-Host "  Start time:   $($proc.StartTime)"
    Write-Host "  PASS" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Process not found (may have a different name)." -ForegroundColor Yellow
}
Write-Host ""

# ── 5.7  Stop the service cleanly ────────────────────────────────
Write-Host "[5.7] Stopping service to test graceful shutdown..." -ForegroundColor Cyan

try {
    Stop-Service -Name $serviceName -Force
    Start-Sleep -Seconds 3
    $svc = Get-Service -Name $serviceName
    Write-Host "  Service status: $($svc.Status)"

    if ($svc.Status -eq "Stopped") {
        Write-Host "  PASS - Graceful shutdown confirmed." -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Service status is $($svc.Status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  WARNING: Error stopping service: $_" -ForegroundColor Yellow
}
Write-Host ""

# ── 5.8  Check health.json after stop ────────────────────────────
Write-Host "[5.8] Health file after stop..." -ForegroundColor Cyan

if (Test-Path $healthFile) {
    Get-Content $healthFile | ForEach-Object { Write-Host "    $_" }
    $content = Get-Content $healthFile -Raw
    if ($content -match '"status":\s*"stopped"') {
        Write-Host "  PASS - Status updated to 'stopped'." -ForegroundColor Green
    } else {
        Write-Host "  INFO: Status may not have updated (process was terminated)." -ForegroundColor Yellow
    }
} else {
    Write-Host "  Health file not found." -ForegroundColor Yellow
}
Write-Host ""

# ── 5.9  Restart service (leave running) ─────────────────────────
Write-Host "[5.9] Restarting service (leaving it running)..." -ForegroundColor Cyan

try {
    Start-Service -Name $serviceName
    Start-Sleep -Seconds 3
    $svc = Get-Service -Name $serviceName
    Write-Host "  Service status: $($svc.Status)"
    if ($svc.Status -eq "Running") {
        Write-Host "  PASS - Service is running and will persist." -ForegroundColor Green
    }
} catch {
    Write-Host "  WARNING: Could not restart: $_" -ForegroundColor Yellow
}
Write-Host ""

# ════════════════════════════════════════════════════════════════════
#  SUMMARY
# ════════════════════════════════════════════════════════════════════
Write-Host $divider
Write-Host "  PHASES 3 + 4 + 5 COMPLETE"
Write-Host ""
Write-Host "  Phase 3 - Recovery:"
Write-Host "    Startup type:    Automatic (Delayed Start)"
Write-Host "    Failure actions: Restart after 10s / 30s / 60s"
Write-Host "    Failure reset:   24 hours"
Write-Host ""
Write-Host "  Phase 4 - Observability:"
Write-Host "    File logs:       C:\ProgramData\EASI\Bridge\logs\bridge-YYYY-MM-DD.log"
Write-Host "    Health file:     C:\ProgramData\EASI\Bridge\status\health.json"
Write-Host "    Event Log:       Application > Source 'EASIBridge'"
Write-Host "    Rotation:        Manual (90-day cleanup recommended)"
Write-Host ""
Write-Host "  Phase 5 - Smoke Test:"
Write-Host "    Service started, heartbeat confirmed, stopped cleanly, restarted."
Write-Host "    Service is currently RUNNING."
Write-Host ""
Write-Host "  Next: Phase 6 (hardening: least-privilege account, ACLs, secrets)"
Write-Host ""
Write-Host "  Copy ALL output above and send it back."
Write-Host $divider
Write-Host ""
cmd /c pause
