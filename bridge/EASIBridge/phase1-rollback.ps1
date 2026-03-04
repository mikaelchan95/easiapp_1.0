<#
    EASI Bridge - Phase 1 Rollback
    Removes everything Phase 1 created. Safe to run multiple times.
#>

Write-Host "EASI Bridge - Phase 1 Rollback" -ForegroundColor Yellow
Write-Host ""

# Kill any running instance
$procs = Get-Process -Name "EASIBridge" -ErrorAction SilentlyContinue
if ($procs) {
    Write-Host "Stopping running EASIBridge process(es)..."
    $procs | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Remove build output
if (Test-Path "C:\EASI\Bridge") {
    Remove-Item -Recurse -Force "C:\EASI\Bridge"
    Write-Host "Removed: C:\EASI\Bridge" -ForegroundColor Green
} else {
    Write-Host "Already gone: C:\EASI\Bridge"
}

# Remove data directories
if (Test-Path "C:\ProgramData\EASI\Bridge") {
    Remove-Item -Recurse -Force "C:\ProgramData\EASI\Bridge"
    Write-Host "Removed: C:\ProgramData\EASI\Bridge" -ForegroundColor Green
} else {
    Write-Host "Already gone: C:\ProgramData\EASI\Bridge"
}

# Clean up empty parent dirs
if ((Test-Path "C:\EASI") -and (@(Get-ChildItem "C:\EASI").Count -eq 0)) {
    Remove-Item "C:\EASI"
    Write-Host "Removed empty: C:\EASI"
}
if ((Test-Path "C:\ProgramData\EASI") -and (@(Get-ChildItem "C:\ProgramData\EASI").Count -eq 0)) {
    Remove-Item "C:\ProgramData\EASI"
    Write-Host "Removed empty: C:\ProgramData\EASI"
}

Write-Host ""
Write-Host "Rollback complete." -ForegroundColor Green
cmd /c pause
