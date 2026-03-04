#Requires -RunAsAdministrator
<#
    EASI Bridge - Phase 2 Rollback
    Removes the EASIBridge Windows Service registration.
    Does NOT delete files (that's phase1-rollback.ps1).
#>

$serviceName = "EASIBridge"

Write-Host "EASI Bridge - Phase 2 Rollback" -ForegroundColor Yellow
Write-Host ""

$svc = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $svc) {
    Write-Host "Service '$serviceName' does not exist. Nothing to remove."
    cmd /c pause
    exit 0
}

if ($svc.Status -ne "Stopped") {
    Write-Host "Stopping service..."
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

Write-Host "Removing service..."
$result = & sc.exe delete $serviceName 2>&1
Write-Host "  sc.exe output: $result"

Start-Sleep -Seconds 2

$check = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($check) {
    Write-Host "WARNING: Service still shows up. It may need a reboot to fully remove." -ForegroundColor Yellow
} else {
    Write-Host "Service '$serviceName' removed." -ForegroundColor Green
}

Write-Host ""
cmd /c pause
