#Requires -RunAsAdministrator
<#
    EASI Bridge - Phase 2: Install as Windows Service
    REQUIRES: Run as Administrator
    
    What this does:
      1. Verifies the built exe exists
      2. Registers EASIBridge as a Windows Service via sc.exe
      3. Sets service description
      4. Verifies registration
    
    What this does NOT do:
      - Does NOT start the service (that's Phase 5)
      - Does NOT configure recovery/startup type (that's Phase 3)
#>

$ErrorActionPreference = "Stop"
$divider = "=" * 60

Write-Host ""
Write-Host $divider
Write-Host "  EASI Bridge - Phase 2: Install as Windows Service"
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host $divider
Write-Host ""

$serviceName = "EASIBridge"
$displayName = "EASI AutoCount Bridge"
$description = "Bridges AutoCount Accounting 2.1 with EASI app via Supabase. Heartbeat-only skeleton (no posting logic)."
$exePath = "C:\EASI\Bridge\EASIBridge.exe"

# ── Step 1: Pre-checks ─────────────────────────────────────────────
Write-Host "[1/4] Pre-checks..." -ForegroundColor Cyan

if (-not (Test-Path $exePath)) {
    Write-Host "  FAIL: $exePath not found." -ForegroundColor Red
    Write-Host "  Run phase1-setup.ps1 first." -ForegroundColor Red
    cmd /c pause
    exit 1
}
Write-Host "  EXE found: $exePath"

$existing = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "  WARNING: Service '$serviceName' already exists (Status: $($existing.Status))." -ForegroundColor Yellow
    Write-Host "  To reinstall, run phase2-rollback.ps1 first, then re-run this script." -ForegroundColor Yellow
    cmd /c pause
    exit 1
}
Write-Host "  No existing '$serviceName' service - good."
Write-Host ""

# ── Step 2: Create the service ─────────────────────────────────────
Write-Host "[2/4] Creating Windows Service..." -ForegroundColor Cyan
Write-Host "  Name:    $serviceName"
Write-Host "  Display: $displayName"
Write-Host "  Binary:  $exePath"
Write-Host "  Account: LocalSystem (hardened in Phase 6)"
Write-Host ""

$scArgs = @(
    "create", $serviceName,
    "binPath=", "`"$exePath`"",
    "DisplayName=", "`"$displayName`"",
    "start=", "demand"
)

$result = & sc.exe $scArgs 2>&1
$scExit = $LASTEXITCODE

Write-Host "  sc.exe output: $result"
if ($scExit -ne 0) {
    Write-Host "  FAIL: sc.exe create returned exit code $scExit" -ForegroundColor Red
    cmd /c pause
    exit 1
}
Write-Host "  Service created." -ForegroundColor Green
Write-Host ""

# ── Step 3: Set description ────────────────────────────────────────
Write-Host "[3/4] Setting service description..." -ForegroundColor Cyan

& sc.exe description $serviceName "`"$description`"" | Out-Null
Write-Host "  Description set." -ForegroundColor Green
Write-Host ""

# ── Step 4: Verify ─────────────────────────────────────────────────
Write-Host "[4/4] Verification..." -ForegroundColor Cyan

$svc = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $svc) {
    Write-Host "  FAIL: Service not found after creation!" -ForegroundColor Red
    cmd /c pause
    exit 1
}

Write-Host "  Service Name:   $($svc.Name)"
Write-Host "  Display Name:   $($svc.DisplayName)"
Write-Host "  Status:         $($svc.Status)"
Write-Host "  Start Type:     $($svc.StartType)"

$wmi = Get-CimInstance Win32_Service -Filter "Name='$serviceName'" -ErrorAction SilentlyContinue
if ($wmi) {
    Write-Host "  Binary Path:    $($wmi.PathName)"
    Write-Host "  Logon Account:  $($wmi.StartName)"
    Write-Host "  Description:    $($wmi.Description)"
}

Write-Host ""
Write-Host "  PASS - Service registered successfully." -ForegroundColor Green
Write-Host "  Status is 'Stopped' - this is correct. We start it in Phase 5." -ForegroundColor Green
Write-Host ""

# ── Summary ─────────────────────────────────────────────────────────
Write-Host $divider
Write-Host "  PHASE 2 COMPLETE"
Write-Host ""
Write-Host "  Service '$serviceName' is registered but NOT running."
Write-Host "  Start type is 'Manual' (changed to 'Automatic (Delayed)' in Phase 3)."
Write-Host ""
Write-Host "  Next: Phase 3 (recovery + startup config)"
Write-Host "  Rollback: Run phase2-rollback.ps1 to remove the service."
Write-Host ""
Write-Host "  Copy ALL output above and send it back."
Write-Host $divider
Write-Host ""
cmd /c pause
