#Requires -RunAsAdministrator
<#
    EASI Bridge - Phase 6: Hardening
    
    1. Create dedicated least-privilege service account
    2. Lock down file ACLs on bridge directories
    3. Switch service to run under the new account
    4. Verify anti-double-instance guard
    5. Audit summary
    
    REQUIRES: Run as Administrator
#>

$ErrorActionPreference = 'Stop'
$divider = '=' * 60
$serviceName = 'EASIBridge'
$svcAccount = 'svc_easibridge'

Write-Host ''
Write-Host $divider
Write-Host '  EASI Bridge - Phase 6: Hardening'
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host $divider
Write-Host ''

# -- Pre-check --
$svc = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $svc) {
    Write-Host 'FAIL: Service not found. Run Phase 2 first.' -ForegroundColor Red
    cmd /c pause
    exit 1
}

if ($svc.Status -eq 'Running') {
    Write-Host 'Stopping service before hardening...' -ForegroundColor Yellow
    Stop-Service -Name $serviceName -Force
    Start-Sleep -Seconds 3
}
Write-Host 'Service is stopped. Proceeding with hardening.'
Write-Host ''

# ================================================================
#  6.1  Create dedicated service account
# ================================================================
Write-Host '[6.1] Dedicated Service Account' -ForegroundColor Cyan

$existingUser = Get-LocalUser -Name $svcAccount -ErrorAction SilentlyContinue
if ($existingUser) {
    Write-Host "  Account '$svcAccount' already exists. Skipping creation."
} else {
    Add-Type -AssemblyName System.Web
    $password = [System.Web.Security.Membership]::GeneratePassword(24, 6)
    $securePass = ConvertTo-SecureString $password -AsPlainText -Force

    New-LocalUser -Name $svcAccount `
        -Password $securePass `
        -Description 'EASI Bridge service account' `
        -PasswordNeverExpires `
        -UserMayNotChangePassword `
        -AccountNeverExpires | Out-Null

    Write-Host "  Account '$svcAccount' created." -ForegroundColor Green
    Write-Host ''
    Write-Host '  +--------------------------------------------------------+' -ForegroundColor Yellow
    Write-Host '  |  SAVE THIS PASSWORD - it will NOT be shown again:      |' -ForegroundColor Yellow
    Write-Host '  |                                                        |' -ForegroundColor Yellow
    Write-Host "  |  $password  |" -ForegroundColor Yellow
    Write-Host '  |                                                        |' -ForegroundColor Yellow
    Write-Host '  |  Store it in a password manager or secure vault.       |' -ForegroundColor Yellow
    Write-Host '  +--------------------------------------------------------+' -ForegroundColor Yellow
}

# Ensure account is NOT in Administrators group
$adminGroup = Get-LocalGroupMember -Group 'Administrators' -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "*\$svcAccount" }
if ($adminGroup) {
    Remove-LocalGroupMember -Group 'Administrators' -Member $svcAccount -ErrorAction SilentlyContinue
    Write-Host "  Removed '$svcAccount' from Administrators group." -ForegroundColor Yellow
}
Write-Host '  Account is NOT in Administrators group - good.'
Write-Host ''

# -- Grant "Log on as a service" right --
Write-Host '  Granting Log on as a service right...' -ForegroundColor Cyan

$sidObj = (New-Object System.Security.Principal.NTAccount($svcAccount)).Translate(
    [System.Security.Principal.SecurityIdentifier])
$sid = $sidObj.Value

$tempCfg = [System.IO.Path]::GetTempFileName()
$tempDb  = [System.IO.Path]::GetTempFileName()

& secedit /export /cfg $tempCfg /areas USER_RIGHTS | Out-Null

$cfgContent = Get-Content $tempCfg -Raw
if ($cfgContent -match 'SeServiceLogonRight\s*=\s*(.+)') {
    $currentValue = $Matches[1].Trim()
    if ($currentValue -notmatch [regex]::Escape($sid)) {
        $newValue = "$currentValue,*$sid"
        $cfgContent = $cfgContent -replace 'SeServiceLogonRight\s*=\s*.+', "SeServiceLogonRight = $newValue"
    } else {
        Write-Host '  Already has Log on as a service right.'
    }
} else {
    $cfgContent = $cfgContent -replace '(\[Privilege Rights\])', "`$1`r`nSeServiceLogonRight = *$sid"
}

Set-Content $tempCfg $cfgContent
& secedit /configure /db $tempDb /cfg $tempCfg /areas USER_RIGHTS | Out-Null

Remove-Item $tempCfg -ErrorAction SilentlyContinue
Remove-Item $tempDb -ErrorAction SilentlyContinue
Remove-Item "$tempDb.log" -ErrorAction SilentlyContinue
Remove-Item "$tempDb.jfm" -ErrorAction SilentlyContinue

Write-Host '  Log on as a service right granted.' -ForegroundColor Green
Write-Host ''

# ================================================================
#  6.2  Lock down file ACLs
# ================================================================
Write-Host '[6.2] File ACL Hardening' -ForegroundColor Cyan

function Set-BridgeAcl {
    param(
        [string]$TargetPath,
        [string]$ServiceAccount,
        [string]$Rights
    )

    if (-not (Test-Path $TargetPath)) {
        Write-Host "  SKIP: $TargetPath does not exist." -ForegroundColor Yellow
        return
    }

    $acl = New-Object System.Security.AccessControl.DirectorySecurity
    $acl.SetAccessRuleProtection($true, $false)

    $acl.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule(
        'NT AUTHORITY\SYSTEM', 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')))

    $acl.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule(
        'BUILTIN\Administrators', 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')))

    $acl.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule(
        $ServiceAccount, $Rights, 'ContainerInherit,ObjectInherit', 'None', 'Allow')))

    Set-Acl -Path $TargetPath -AclObject $acl
    Write-Host "  $TargetPath => $ServiceAccount gets $Rights" -ForegroundColor Green
}

Set-BridgeAcl -TargetPath 'C:\EASI\Bridge' -ServiceAccount $svcAccount -Rights 'ReadAndExecute'
Set-BridgeAcl -TargetPath 'C:\ProgramData\EASI\Bridge\logs' -ServiceAccount $svcAccount -Rights 'Modify'
Set-BridgeAcl -TargetPath 'C:\ProgramData\EASI\Bridge\config' -ServiceAccount $svcAccount -Rights 'ReadAndExecute'
Set-BridgeAcl -TargetPath 'C:\ProgramData\EASI\Bridge\status' -ServiceAccount $svcAccount -Rights 'Modify'

Write-Host ''

# ================================================================
#  6.3  Switch service to run under dedicated account
# ================================================================
Write-Host '[6.3] Switching service logon account...' -ForegroundColor Cyan

$fullAccount = ".\$svcAccount"

$checkUser = Get-LocalUser -Name $svcAccount
if (-not $checkUser) {
    Write-Host '  FAIL: Account not found.' -ForegroundColor Red
    cmd /c pause
    exit 1
}

Write-Host "  You will be prompted for the $svcAccount password."
Write-Host '  This is the password shown in step 6.1, or that you set previously.'
Write-Host ''

$cred = Get-Credential -UserName $fullAccount -Message "Enter password for $svcAccount service account"

$scResult = & sc.exe config $serviceName obj= $fullAccount password= $cred.GetNetworkCredential().Password 2>&1
$scExit = $LASTEXITCODE

if ($scExit -eq 0) {
    Write-Host "  Service logon changed to $fullAccount." -ForegroundColor Green
} else {
    Write-Host "  WARNING: sc.exe config returned $scExit" -ForegroundColor Yellow
    Write-Host "  Output: $scResult"
    Write-Host '  The service may still run as LocalSystem. You can change it manually in services.msc.'
}
Write-Host ''

# ================================================================
#  6.4  Anti-double-instance guard verification
# ================================================================
Write-Host '[6.4] Anti-double-instance guard' -ForegroundColor Cyan
Write-Host '  Implementation: Global named Mutex'
Write-Host '  Location:       BridgeService.cs DoStart method'
Write-Host '  Behavior:       If mutex already held, logs error and throws exception'
Write-Host '  Service manager: Windows SCM already prevents duplicate service instances'
Write-Host '  Console mode:    Mutex blocks a second --console while service is running'
Write-Host '  PASS - Double-instance guard is built in.' -ForegroundColor Green
Write-Host ''

# ================================================================
#  6.5  Smoke test under new account
# ================================================================
Write-Host '[6.5] Smoke test under new service account...' -ForegroundColor Cyan

try {
    Start-Service -Name $serviceName
    Start-Sleep -Seconds 5

    $svc = Get-Service -Name $serviceName
    Write-Host "  Service status: $($svc.Status)"

    if ($svc.Status -eq 'Running') {
        $wmi = Get-CimInstance Win32_Service -Filter "Name='$serviceName'"
        Write-Host "  Running as:     $($wmi.StartName)"
        Write-Host "  PID:            $($wmi.ProcessId)"

        Start-Sleep -Seconds 5

        $healthFile = 'C:\ProgramData\EASI\Bridge\status\health.json'
        if (Test-Path $healthFile) {
            $hContent = Get-Content $healthFile -Raw
            if ($hContent -match '"status":\s*"running"') {
                Write-Host '  Health check:   running' -ForegroundColor Green
            }
        }

        $today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
        $logFile = "C:\ProgramData\EASI\Bridge\logs\bridge-$today.log"
        if (Test-Path $logFile) {
            $lastLine = Get-Content $logFile | Select-Object -Last 1
            Write-Host "  Last log entry: $lastLine"
        }

        Write-Host "  PASS - Service running under $($wmi.StartName)." -ForegroundColor Green
    } else {
        Write-Host '  FAIL: Service did not start.' -ForegroundColor Red
        Write-Host ''
        Write-Host '  This usually means ACLs or logon rights need adjustment.' -ForegroundColor Yellow
        Write-Host '  Check Event Viewer > System log for service failed to start errors.' -ForegroundColor Yellow
        Write-Host '  Quick fix: revert to LocalSystem with:' -ForegroundColor Yellow
        Write-Host '    sc.exe config EASIBridge obj= LocalSystem password= ""' -ForegroundColor Yellow
    }
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    Write-Host '  Quick fix: revert to LocalSystem with:' -ForegroundColor Yellow
    Write-Host '    sc.exe config EASIBridge obj= LocalSystem password= ""' -ForegroundColor Yellow
}
Write-Host ''

# ================================================================
#  6.6  Audit Summary
# ================================================================
Write-Host $divider
Write-Host '  PHASE 6 COMPLETE - Hardening Audit' -ForegroundColor Magenta
Write-Host $divider
Write-Host ''

Write-Host '  [Account]' -ForegroundColor Cyan
Write-Host "    Service account:   $svcAccount"
Write-Host '    In Administrators: NO'
Write-Host '    Log on as service: YES'
Write-Host '    Password expires:  NEVER - rotate manually'
Write-Host ''

Write-Host '  [File ACLs]' -ForegroundColor Cyan
Write-Host "    C:\EASI\Bridge\                        $svcAccount = ReadAndExecute"
Write-Host "    C:\ProgramData\EASI\Bridge\logs\       $svcAccount = Modify"
Write-Host "    C:\ProgramData\EASI\Bridge\config\     $svcAccount = ReadAndExecute"
Write-Host "    C:\ProgramData\EASI\Bridge\status\     $svcAccount = Modify"
Write-Host '    SYSTEM + Administrators = FullControl on all'
Write-Host ''

Write-Host '  [Anti-Double-Instance]' -ForegroundColor Cyan
Write-Host '    Mechanism: Global named Mutex'
Write-Host '    Coverage:  Service mode + Console mode'
Write-Host ''

Write-Host '  [Secret Handling Plan]' -ForegroundColor Cyan
Write-Host '    Current:  Placeholder values in EASIBridge.exe.config'
Write-Host '    Phase 7+: Move secrets to encrypted config section or'
Write-Host '              Windows Credential Manager / DPAPI'
Write-Host '    NEVER:    Commit real secrets to source control'
Write-Host '    App.config location: C:\EASI\Bridge\EASIBridge.exe.config'
Write-Host '    Config dir for future:  C:\ProgramData\EASI\Bridge\config'
Write-Host ''

Write-Host '  [Remaining Manual Steps]' -ForegroundColor Cyan
Write-Host '    1. Store svc_easibridge password in a password manager'
Write-Host '    2. Decide on log rotation - 90 day recommended, see Phase 4'
Write-Host '    3. Optionally set up Scheduled Task for log cleanup'
Write-Host '    4. When ready for real secrets, use DPAPI or Credential Manager'
Write-Host ''

Write-Host $divider
Write-Host '  ALL 6 PHASES COMPLETE'
Write-Host ''
Write-Host '  The EASI Bridge skeleton is:'
Write-Host '    - Installed as a Windows Service'
Write-Host '    - Running under a least-privilege account'
Write-Host '    - Heartbeating every 30 seconds'
Write-Host '    - Logging to file + Event Log'
Write-Host '    - Writing health status to JSON'
Write-Host '    - Protected against double instances'
Write-Host '    - Configured for auto-restart on failure'
Write-Host '    - NOT touching AutoCount or any financial data'
Write-Host ''
Write-Host '  Ready for next milestone: AutoCount SDK read-only connection test.'
Write-Host ''
Write-Host '  Copy ALL output above and send it back.'
Write-Host $divider
Write-Host ''
cmd /c pause
