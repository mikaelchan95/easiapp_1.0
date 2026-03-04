<#
    EASI Bridge - Build & Console Test (with AutoCount SDK)
    Run on the server PC. Does NOT require admin.
    Creates directories, compiles the service, runs a console smoke test.
#>

$ErrorActionPreference = 'Stop'
$divider = '=' * 60

Write-Host ''
Write-Host $divider
Write-Host '  EASI Bridge - Build with AutoCount SDK'
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host $divider
Write-Host ''

$srcDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "[1/5] Source directory: $srcDir"
Write-Host ''

# -- Step 1: Create directory structure --
Write-Host '[2/5] Creating directory structure...' -ForegroundColor Cyan

$dirs = @(
    'C:\EASI\Bridge',
    'C:\ProgramData\EASI\Bridge\logs',
    'C:\ProgramData\EASI\Bridge\config',
    'C:\ProgramData\EASI\Bridge\status'
)

foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
        Write-Host "  Created: $d" -ForegroundColor Green
    } else {
        Write-Host "  Exists:  $d"
    }
}
Write-Host ''

# -- Step 2: Verify source files --
Write-Host '[3/5] Verifying source files...' -ForegroundColor Cyan

$sourceFiles = @(
    'Program.cs',
    'BridgeService.cs',
    'BridgeLogger.cs',
    'HealthWriter.cs',
    'BridgeConfig.cs',
    'AutoCountConnector.cs',
    'AssemblyInfo.cs'
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

$configFile = Join-Path $srcDir 'App.config'
if (Test-Path $configFile) { Write-Host '  OK: App.config' }
else { Write-Host '  MISSING: App.config' -ForegroundColor Red; $missing += 'App.config' }

if ($missing.Count -gt 0) {
    Write-Host "`nERROR: Missing files. Cannot build." -ForegroundColor Red
    cmd /c pause
    exit 1
}
Write-Host ''

# -- Step 3: Verify AutoCount DLLs --
Write-Host '[4/5] Checking AutoCount SDK...' -ForegroundColor Cyan

$acPath = 'C:\Program Files\AutoCount\Accounting 2.1'
$acDll = Join-Path $acPath 'AutoCount.dll'
if (Test-Path $acDll) {
    $fi = Get-Item $acDll
    Write-Host "  AutoCount.dll: FOUND ($($fi.Length) bytes)"
} else {
    Write-Host "  AutoCount.dll: NOT FOUND at $acPath" -ForegroundColor Red
    Write-Host '  Build will proceed but AutoCount features will fail at runtime.'
}
Write-Host ''

# -- Step 4: Compile --
Write-Host '[5/5] Compiling...' -ForegroundColor Cyan

$csc = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) {
    $csc = 'C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe'
}
if (-not (Test-Path $csc)) {
    Write-Host 'ERROR: csc.exe not found' -ForegroundColor Red
    cmd /c pause
    exit 1
}

Write-Host "  Compiler: $csc"

$outDir = 'C:\EASI\Bridge'
$outExe = Join-Path $outDir 'EASIBridge.exe'

# Stop service if running (best effort, may fail without admin)
$svc = Get-Service -Name 'EASIBridge' -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -eq 'Running') {
    Write-Host '  Stopping running service...' -ForegroundColor Yellow
    try {
        Stop-Service -Name 'EASIBridge' -Force -ErrorAction Stop
        Start-Sleep -Seconds 3
    } catch {
        Write-Host '  Could not stop service. Run as admin or stop manually.' -ForegroundColor Red
        cmd /c pause
        exit 1
    }
}

# Also kill any console-mode instance
$procs = Get-Process -Name 'EASIBridge' -ErrorAction SilentlyContinue
if ($procs) {
    $procs | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

$csFiles = $sourceFiles | ForEach-Object { Join-Path $srcDir $_ }

$refs = @(
    '/reference:System.dll',
    '/reference:System.Data.dll',
    '/reference:System.Configuration.dll',
    '/reference:System.ServiceProcess.dll'
)

# Add AutoCount.dll as compile-time reference if available
if (Test-Path $acDll) {
    $refs += "/reference:`"$acDll`""
}

& $csc /nologo /target:exe /platform:anycpu `
    /out:$outExe `
    $refs `
    $csFiles

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nBUILD FAILED - see errors above" -ForegroundColor Red
    cmd /c pause
    exit 1
}

Copy-Item $configFile (Join-Path $outDir 'EASIBridge.exe.config') -Force

Write-Host ''
Write-Host '  BUILD SUCCESS' -ForegroundColor Green
Write-Host "  Output: $outExe"

$exeInfo = Get-Item $outExe
Write-Host "  Size: $($exeInfo.Length) bytes"
Write-Host ''

# -- Reminder about password --
$cfgPath = Join-Path $outDir 'EASIBridge.exe.config'
$cfgContent = Get-Content $cfgPath -Raw
if ($cfgContent -match '__AC_PASSWORD__') {
    Write-Host '  +--------------------------------------------------------+' -ForegroundColor Yellow
    Write-Host '  |  IMPORTANT: You must set the AutoCount password!       |' -ForegroundColor Yellow
    Write-Host '  |                                                        |' -ForegroundColor Yellow
    Write-Host '  |  Edit: C:\EASI\Bridge\EASIBridge.exe.config            |' -ForegroundColor Yellow
    Write-Host '  |  Replace __AC_PASSWORD__ with the EASIBRIDG password   |' -ForegroundColor Yellow
    Write-Host '  +--------------------------------------------------------+' -ForegroundColor Yellow
    Write-Host ''
}

Write-Host $divider
Write-Host '  BUILD COMPLETE'
Write-Host ''
Write-Host '  To test in console mode:'
Write-Host '    & "C:\EASI\Bridge\EASIBridge.exe" --console'
Write-Host ''
Write-Host '  To restart the service:'
Write-Host '    Start-Service EASIBridge'
Write-Host $divider
Write-Host ''
cmd /c pause
