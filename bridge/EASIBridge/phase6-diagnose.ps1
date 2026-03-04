#Requires -RunAsAdministrator
<#
    EASI Bridge - Phase 6 Service Start Failure Diagnosis
    Checks Event Viewer and permissions to find the root cause.
#>

$ErrorActionPreference = 'Continue'
$serviceName = 'EASIBridge'
$svcAccount = 'svc_easibridge'
$divider = '=' * 60

Write-Host ''
Write-Host $divider
Write-Host '  EASI Bridge - Phase 6 Diagnosis'
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host $divider
Write-Host ''

# -- 1. System Event Log errors for service start failures --
Write-Host '[1] System Event Log - Service Control Manager errors' -ForegroundColor Cyan
try {
    $sysEvents = Get-EventLog -LogName System -Source 'Service Control Manager' -Newest 10 -ErrorAction Stop |
        Where-Object { $_.Message -match 'EASIBridge' -or $_.Message -match 'EASI' }
    if ($sysEvents) {
        foreach ($evt in $sysEvents) {
            Write-Host "  [$($evt.TimeGenerated.ToString('HH:mm:ss'))] [$($evt.EntryType)] EventID=$($evt.EventID)"
            Write-Host "  $($evt.Message)"
            Write-Host ''
        }
    } else {
        Write-Host '  No EASIBridge-related SCM events found in last 10 entries.'
        Write-Host '  Showing all recent SCM errors:'
        $allScm = Get-EventLog -LogName System -Source 'Service Control Manager' -EntryType Error -Newest 5 -ErrorAction SilentlyContinue
        if ($allScm) {
            foreach ($evt in $allScm) {
                Write-Host "  [$($evt.TimeGenerated.ToString('HH:mm:ss'))] $($evt.Message)"
                Write-Host ''
            }
        } else {
            Write-Host '  No recent SCM errors.'
        }
    }
} catch {
    Write-Host "  Could not read System log: $_" -ForegroundColor Yellow
}
Write-Host ''

# -- 2. Application Event Log --
Write-Host '[2] Application Event Log - EASIBridge + .NET errors' -ForegroundColor Cyan
try {
    $appEvents = Get-EventLog -LogName Application -Newest 20 -ErrorAction Stop |
        Where-Object {
            $_.Source -match 'EASIBridge' -or
            $_.Source -match '\.NET Runtime' -or
            $_.Source -match 'Application Error'
        } |
        Select-Object -First 10
    if ($appEvents) {
        foreach ($evt in $appEvents) {
            Write-Host "  [$($evt.TimeGenerated.ToString('HH:mm:ss'))] [$($evt.Source)] [$($evt.EntryType)]"
            $msg = $evt.Message
            if ($msg.Length -gt 500) { $msg = $msg.Substring(0, 500) + '...' }
            Write-Host "  $msg"
            Write-Host ''
        }
    } else {
        Write-Host '  No relevant Application events found.'
    }
} catch {
    Write-Host "  Could not read Application log: $_" -ForegroundColor Yellow
}
Write-Host ''

# -- 3. Service configuration --
Write-Host '[3] Current service configuration' -ForegroundColor Cyan
$wmi = Get-CimInstance Win32_Service -Filter "Name='$serviceName'" -ErrorAction SilentlyContinue
if ($wmi) {
    Write-Host "  Name:       $($wmi.Name)"
    Write-Host "  State:      $($wmi.State)"
    Write-Host "  StartName:  $($wmi.StartName)"
    Write-Host "  PathName:   $($wmi.PathName)"
    Write-Host "  StartMode:  $($wmi.StartMode)"
    Write-Host "  ExitCode:   $($wmi.ExitCode)"
} else {
    Write-Host '  Service not found in WMI.'
}
Write-Host ''

# -- 4. Test exe directly as the service account --
Write-Host '[4] File access test for service account' -ForegroundColor Cyan

$exePath = 'C:\EASI\Bridge\EASIBridge.exe'
$configPath = 'C:\EASI\Bridge\EASIBridge.exe.config'

$paths = @(
    $exePath,
    $configPath,
    'C:\ProgramData\EASI\Bridge\logs',
    'C:\ProgramData\EASI\Bridge\status',
    'C:\ProgramData\EASI\Bridge\config'
)

foreach ($p in $paths) {
    if (Test-Path $p) {
        $acl = Get-Acl $p
        $hasAccess = $acl.Access | Where-Object {
            $_.IdentityReference -match $svcAccount -or
            $_.IdentityReference -match 'SYSTEM' -or
            $_.IdentityReference -match 'Administrators'
        }
        if ($hasAccess) {
            $svcRule = $acl.Access | Where-Object { $_.IdentityReference -match $svcAccount }
            if ($svcRule) {
                Write-Host "  $p => $($svcRule.FileSystemRights)" -ForegroundColor Green
            } else {
                Write-Host "  $p => no direct ACE for $svcAccount" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  $p => NOT FOUND" -ForegroundColor Red
    }
}
Write-Host ''

# -- 5. Check if Log on as service right is effective --
Write-Host '[5] Checking effective Log on as a service right' -ForegroundColor Cyan
$tempFile = [System.IO.Path]::GetTempFileName()
& secedit /export /cfg $tempFile /areas USER_RIGHTS 2>$null | Out-Null
$rights = Get-Content $tempFile -Raw -ErrorAction SilentlyContinue
Remove-Item $tempFile -ErrorAction SilentlyContinue

$sidObj = $null
try {
    $sidObj = (New-Object System.Security.Principal.NTAccount($svcAccount)).Translate(
        [System.Security.Principal.SecurityIdentifier])
} catch {
    Write-Host "  Cannot resolve SID for $svcAccount" -ForegroundColor Red
}

if ($sidObj -and $rights) {
    if ($rights -match 'SeServiceLogonRight') {
        $line = ($rights -split "`n" | Where-Object { $_ -match 'SeServiceLogonRight' })
        Write-Host "  Policy line: $($line.Trim())"
        if ($line -match [regex]::Escape($sidObj.Value)) {
            Write-Host "  SID $($sidObj.Value) IS in the policy. PASS." -ForegroundColor Green
        } else {
            Write-Host "  SID $($sidObj.Value) NOT in the policy. This is the problem." -ForegroundColor Red
        }
    } else {
        Write-Host '  SeServiceLogonRight not found in exported policy.' -ForegroundColor Red
    }
}
Write-Host ''

# -- 6. Try to start the service and capture detailed error --
Write-Host '[6] Attempting service start with detailed error capture' -ForegroundColor Cyan
try {
    Start-Service -Name $serviceName -ErrorAction Stop
    Start-Sleep -Seconds 3
    $svc = Get-Service -Name $serviceName
    Write-Host "  Service status: $($svc.Status)" -ForegroundColor Green
} catch {
    $err = $_
    Write-Host "  Start failed: $($err.Exception.Message)" -ForegroundColor Red
    if ($err.Exception.InnerException) {
        Write-Host "  Inner: $($err.Exception.InnerException.Message)" -ForegroundColor Red
    }

    # Check if process crashed immediately
    Start-Sleep -Seconds 2
    $crashEvents = Get-EventLog -LogName Application -Source 'Application Error' -Newest 3 -ErrorAction SilentlyContinue |
        Where-Object { $_.Message -match 'EASIBridge' }
    if ($crashEvents) {
        Write-Host ''
        Write-Host '  Application crash detected:' -ForegroundColor Red
        foreach ($evt in $crashEvents) {
            Write-Host "  $($evt.Message)"
        }
    }

    $dotnetEvents = Get-EventLog -LogName Application -Source '.NET Runtime' -Newest 3 -ErrorAction SilentlyContinue
    if ($dotnetEvents) {
        Write-Host ''
        Write-Host '  .NET Runtime errors:' -ForegroundColor Red
        foreach ($evt in $dotnetEvents) {
            $msg = $evt.Message
            if ($msg.Length -gt 800) { $msg = $msg.Substring(0, 800) + '...' }
            Write-Host "  $msg"
        }
    }
}
Write-Host ''

Write-Host $divider
Write-Host '  DIAGNOSIS COMPLETE - copy everything above and send it back.'
Write-Host $divider
Write-Host ''
cmd /c pause
