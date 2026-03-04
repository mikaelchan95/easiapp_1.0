<#
    EASI Bridge - Phase 1 Setup & Build
    Run on the server PC. Does NOT require admin.
    Creates directories, compiles the service, runs a console smoke test.
#>

$ErrorActionPreference = "Stop"
$divider = "=" * 60

Write-Host ""
Write-Host $divider
Write-Host "  EASI Bridge - Phase 1: Build & Console Test"
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host $divider
Write-Host ""

# ── Locate this script's directory (source files live here) ─────────
$srcDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "[1/6] Source directory: $srcDir"
Write-Host ""

# ── Step 1: Create directory structure ──────────────────────────────
Write-Host "[2/6] Creating directory structure..." -ForegroundColor Cyan

$dirs = @(
    "C:\EASI\Bridge",
    "C:\ProgramData\EASI\Bridge\logs",
    "C:\ProgramData\EASI\Bridge\config",
    "C:\ProgramData\EASI\Bridge\status"
)

foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
        Write-Host "  Created: $d" -ForegroundColor Green
    } else {
        Write-Host "  Exists:  $d"
    }
}
Write-Host ""

# ── Step 2: Verify source files ────────────────────────────────────
Write-Host "[3/6] Verifying source files..." -ForegroundColor Cyan

$sourceFiles = @(
    "Program.cs",
    "BridgeService.cs",
    "BridgeLogger.cs",
    "HealthWriter.cs",
    "BridgeConfig.cs",
    "AssemblyInfo.cs"
)

$missing = @()
foreach ($f in $sourceFiles) {
    $fp = Join-Path $srcDir $f
    if (Test-Path $fp) {
        Write-Host "  OK: $f"
    } else {
        Write-Host "  MISSING: $f" -ForegroundColor Red
        $missing += $f
    }
}

$configFile = Join-Path $srcDir "App.config"
if (Test-Path $configFile) {
    Write-Host "  OK: App.config"
} else {
    Write-Host "  MISSING: App.config" -ForegroundColor Red
    $missing += "App.config"
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "ERROR: Missing files. Cannot build." -ForegroundColor Red
    cmd /c pause
    exit 1
}
Write-Host ""

# ── Step 3: Compile ────────────────────────────────────────────────
Write-Host "[4/6] Compiling..." -ForegroundColor Cyan

$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) {
    $csc = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
}
if (-not (Test-Path $csc)) {
    Write-Host "ERROR: csc.exe not found" -ForegroundColor Red
    cmd /c pause
    exit 1
}

Write-Host "  Compiler: $csc"

$outDir = "C:\EASI\Bridge"
$outExe = Join-Path $outDir "EASIBridge.exe"

$csFiles = $sourceFiles | ForEach-Object { Join-Path $srcDir $_ }

& $csc /nologo /target:exe /platform:anycpu `
    /out:$outExe `
    /reference:System.dll `
    /reference:System.Configuration.dll `
    /reference:System.ServiceProcess.dll `
    $csFiles

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED - see errors above" -ForegroundColor Red
    cmd /c pause
    exit 1
}

Copy-Item $configFile (Join-Path $outDir "EASIBridge.exe.config") -Force

Write-Host ""
Write-Host "  BUILD SUCCESS" -ForegroundColor Green
Write-Host "  Output: $outExe"
Write-Host "  Config: $outDir\EASIBridge.exe.config"
Write-Host ""

# ── Step 4: Verify build output ───────────────────────────────────
Write-Host "[5/6] Verifying build output..." -ForegroundColor Cyan

$exeInfo = Get-Item $outExe
Write-Host ("  EASIBridge.exe  Size={0} bytes  Modified={1}" -f $exeInfo.Length, $exeInfo.LastWriteTime)

$cfgInfo = Get-Item (Join-Path $outDir "EASIBridge.exe.config")
Write-Host ("  EASIBridge.exe.config  Size={0} bytes" -f $cfgInfo.Length)
Write-Host ""

# ── Step 5: Console smoke test ────────────────────────────────────
Write-Host "[6/6] Console Smoke Test" -ForegroundColor Cyan
Write-Host "  Starting EASIBridge.exe --console for ~35 seconds..."
Write-Host "  (Will capture 1 startup + at least 1 heartbeat, then auto-stop)"
Write-Host ""

$proc = Start-Process -FilePath $outExe -ArgumentList "--console" `
    -PassThru -NoNewWindow -RedirectStandardOutput (Join-Path $outDir "smoke-stdout.txt") `
    -RedirectStandardError (Join-Path $outDir "smoke-stderr.txt")

Write-Host "  PID: $($proc.Id)"
Write-Host "  Waiting 35 seconds for heartbeat..."

Start-Sleep -Seconds 35

if (-not $proc.HasExited) {
    $proc.Kill()
    $proc.WaitForExit(5000)
    Write-Host "  Process stopped (killed after smoke test window)."
} else {
    Write-Host "  Process exited early with code: $($proc.ExitCode)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  --- Smoke Test Results ---" -ForegroundColor Cyan

# Check stdout
$stdoutFile = Join-Path $outDir "smoke-stdout.txt"
if (Test-Path $stdoutFile) {
    $stdout = Get-Content $stdoutFile
    Write-Host "  Console output ($($stdout.Count) lines):"
    foreach ($line in $stdout) {
        Write-Host "    $line"
    }
} else {
    Write-Host "  No stdout captured." -ForegroundColor Yellow
}
Write-Host ""

# Check log file
$today = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")
$logFile = Join-Path "C:\ProgramData\EASI\Bridge\logs" "bridge-$today.log"
if (Test-Path $logFile) {
    $logLines = Get-Content $logFile
    Write-Host "  Log file: $logFile ($($logLines.Count) lines):"
    foreach ($line in $logLines) {
        Write-Host "    $line"
    }
} else {
    Write-Host "  WARNING: Log file not found at $logFile" -ForegroundColor Yellow
}
Write-Host ""

# Check health.json
$healthFile = "C:\ProgramData\EASI\Bridge\status\health.json"
if (Test-Path $healthFile) {
    Write-Host "  Health file: $healthFile"
    Write-Host "  Contents:"
    Get-Content $healthFile | ForEach-Object { Write-Host "    $_" }
} else {
    Write-Host "  WARNING: Health file not found" -ForegroundColor Yellow
}
Write-Host ""

# Check stderr
$stderrFile = Join-Path $outDir "smoke-stderr.txt"
if ((Test-Path $stderrFile) -and ((Get-Item $stderrFile).Length -gt 0)) {
    Write-Host "  STDERR output:" -ForegroundColor Yellow
    Get-Content $stderrFile | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
    Write-Host ""
}

# Cleanup smoke test files
Remove-Item $stdoutFile -ErrorAction SilentlyContinue
Remove-Item $stderrFile -ErrorAction SilentlyContinue

# ── Summary ─────────────────────────────────────────────────────────
Write-Host $divider
Write-Host "  PHASE 1 COMPLETE"
Write-Host ""
Write-Host "  Files deployed to: C:\EASI\Bridge\"
Write-Host "  Logs:              C:\ProgramData\EASI\Bridge\logs\"
Write-Host "  Health status:     C:\ProgramData\EASI\Bridge\status\health.json"
Write-Host ""
Write-Host "  Copy ALL output above and send it back."
Write-Host $divider
Write-Host ""
cmd /c pause
