<#
    One-time script: build and run the DMF credential extractor on the Epico PC.
    Run from the bridge folder (or from repo root, script will find sources).
    Usage: .\extract-dmf-credentials.ps1 [output-file.txt]
    If output file is omitted, credentials are printed to console only.
#>

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$srcDir = $scriptDir
$acPath = 'C:\Program Files\AutoCount\Accounting 2.1'
$acDll = Join-Path $acPath 'AutoCount.dll'

if (-not (Test-Path $acDll)) {
    Write-Host 'ERROR: AutoCount.dll not found. Run this script on the Epico PC where AutoCount is installed.' -ForegroundColor Red
    exit 1
}

$csc = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) {
    $csc = 'C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe'
}
if (-not (Test-Path $csc)) {
    Write-Host 'ERROR: csc.exe not found.' -ForegroundColor Red
    exit 1
}

$outDir = $srcDir
$outExe = Join-Path $outDir 'ExtractDmfCredentials.exe'
$extractorCs = Join-Path $srcDir 'ExtractDmfCredentials.cs'

if (-not (Test-Path $extractorCs)) {
    Write-Host 'ERROR: ExtractDmfCredentials.cs not found.' -ForegroundColor Red
    exit 1
}

Write-Host 'Building ExtractDmfCredentials.exe ...'
& $csc /nologo /target:exe /out:$outExe `
    /reference:$acDll `
    /reference:System.dll `
    /reference:System.Data.dll `
    $extractorCs

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Build failed.' -ForegroundColor Red
    exit 1
}

Write-Host 'Running extractor...'
Write-Host ''

$outputFile = $args[0]
if ($outputFile) {
    & $outExe $outputFile
} else {
    & $outExe
}

$exitCode = $LASTEXITCODE
if ($exitCode -eq 0 -and $outputFile) {
    Write-Host ''
    Write-Host 'Save the output file somewhere safe and add it to .gitignore (or do not commit).' -ForegroundColor Yellow
}
exit $exitCode
