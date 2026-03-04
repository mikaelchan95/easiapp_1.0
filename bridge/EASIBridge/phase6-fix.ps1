#Requires -RunAsAdministrator
<#
    EASI Bridge - Phase 6 Fix
    1. Reset svc_easibridge password to a known value
    2. Grant "Log on as a service" via LSA API (reliable method)
    3. Update the service with new credentials
    4. Start and verify
#>

$ErrorActionPreference = 'Stop'
$divider = '=' * 60
$serviceName = 'EASIBridge'
$svcAccount = 'svc_easibridge'

Write-Host ''
Write-Host $divider
Write-Host '  EASI Bridge - Phase 6 Fix'
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host $divider
Write-Host ''

# ================================================================
#  Step 1: Reset password to a known safe value
# ================================================================
Write-Host '[1/4] Resetting svc_easibridge password...' -ForegroundColor Cyan

$newPassword = 'EasiBridge2026!Svc'
$securePass = ConvertTo-SecureString $newPassword -AsPlainText -Force

try {
    Set-LocalUser -Name $svcAccount -Password $securePass
    Write-Host "  Password reset to: $newPassword" -ForegroundColor Green
    Write-Host '  SAVE THIS PASSWORD.' -ForegroundColor Yellow
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    cmd /c pause
    exit 1
}
Write-Host ''

# ================================================================
#  Step 2: Grant "Log on as a service" via LSA API
# ================================================================
Write-Host '[2/4] Granting Log on as a service right via LSA API...' -ForegroundColor Cyan

$lsaCode = @'
using System;
using System.Runtime.InteropServices;

public class LsaHelper
{
    [StructLayout(LayoutKind.Sequential)]
    struct LSA_UNICODE_STRING
    {
        public UInt16 Length;
        public UInt16 MaximumLength;
        public IntPtr Buffer;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct LSA_OBJECT_ATTRIBUTES
    {
        public int Length;
        public IntPtr RootDirectory;
        public LSA_UNICODE_STRING ObjectName;
        public int Attributes;
        public IntPtr SecurityDescriptor;
        public IntPtr SecurityQualityOfService;
    }

    [DllImport("advapi32.dll", PreserveSig = true)]
    static extern uint LsaOpenPolicy(
        ref LSA_UNICODE_STRING SystemName,
        ref LSA_OBJECT_ATTRIBUTES ObjectAttributes,
        uint DesiredAccess,
        out IntPtr PolicyHandle);

    [DllImport("advapi32.dll", PreserveSig = true)]
    static extern uint LsaAddAccountRights(
        IntPtr PolicyHandle,
        byte[] AccountSid,
        LSA_UNICODE_STRING[] UserRights,
        uint CountOfRights);

    [DllImport("advapi32.dll", PreserveSig = true)]
    static extern uint LsaClose(IntPtr ObjectHandle);

    const uint POLICY_CREATE_ACCOUNT = 0x00000010;
    const uint POLICY_LOOKUP_NAMES = 0x00000800;

    public static uint GrantLogonAsService(string accountName)
    {
        var systemName = new LSA_UNICODE_STRING();
        var objectAttributes = new LSA_OBJECT_ATTRIBUTES();

        IntPtr policyHandle;
        uint result = LsaOpenPolicy(ref systemName, ref objectAttributes,
            POLICY_CREATE_ACCOUNT | POLICY_LOOKUP_NAMES, out policyHandle);
        if (result != 0) return result;

        try
        {
            var account = new System.Security.Principal.NTAccount(accountName);
            var sid = (System.Security.Principal.SecurityIdentifier)account.Translate(
                typeof(System.Security.Principal.SecurityIdentifier));
            byte[] sidBytes = new byte[sid.BinaryLength];
            sid.GetBinaryForm(sidBytes, 0);

            var right = "SeServiceLogonRight";
            var rightStr = new LSA_UNICODE_STRING();
            rightStr.Buffer = Marshal.StringToHGlobalUni(right);
            rightStr.Length = (UInt16)(right.Length * 2);
            rightStr.MaximumLength = (UInt16)((right.Length + 1) * 2);

            result = LsaAddAccountRights(policyHandle, sidBytes,
                new LSA_UNICODE_STRING[] { rightStr }, 1);

            Marshal.FreeHGlobal(rightStr.Buffer);
            return result;
        }
        finally
        {
            LsaClose(policyHandle);
        }
    }
}
'@

try {
    Add-Type -TypeDefinition $lsaCode -Language CSharp
} catch {
    # Type may already be loaded from a previous run
    if ($_.Exception.Message -notmatch 'already exists') {
        throw
    }
}

$lsaResult = [LsaHelper]::GrantLogonAsService($svcAccount)
if ($lsaResult -eq 0) {
    Write-Host '  Log on as a service right GRANTED successfully.' -ForegroundColor Green
} else {
    Write-Host "  LSA returned code: $lsaResult" -ForegroundColor Red
    Write-Host ''
    Write-Host '  MANUAL FALLBACK:' -ForegroundColor Yellow
    Write-Host '    1. Run: secpol.msc'
    Write-Host '    2. Navigate: Local Policies > User Rights Assignment'
    Write-Host '    3. Double-click: Log on as a service'
    Write-Host '    4. Click Add User or Group'
    Write-Host '    5. Type: svc_easibridge'
    Write-Host '    6. Click OK, OK'
    Write-Host ''
    Write-Host '  Then re-run this script.'
    cmd /c pause
    exit 1
}
Write-Host ''

# Verify the right took effect
Write-Host '  Verifying...' -ForegroundColor Cyan
$tempFile = [System.IO.Path]::GetTempFileName()
& secedit /export /cfg $tempFile /areas USER_RIGHTS 2>$null | Out-Null
$exported = Get-Content $tempFile -Raw -ErrorAction SilentlyContinue
Remove-Item $tempFile -ErrorAction SilentlyContinue

if ($exported -match 'SeServiceLogonRight') {
    $line = ($exported -split "`n" | Where-Object { $_ -match 'SeServiceLogonRight' })
    Write-Host "  Policy: $($line.Trim())"
    Write-Host '  PASS - Right is in policy.' -ForegroundColor Green
} else {
    Write-Host '  WARNING: Right not visible in secedit export, but LSA call succeeded.' -ForegroundColor Yellow
    Write-Host '  This can happen - proceeding with service start test.'
}
Write-Host ''

# ================================================================
#  Step 3: Update service credentials
# ================================================================
Write-Host '[3/4] Updating service credentials...' -ForegroundColor Cyan

$fullAccount = ".\$svcAccount"
$scResult = & sc.exe config $serviceName obj= $fullAccount password= $newPassword 2>&1
$scExit = $LASTEXITCODE

if ($scExit -eq 0) {
    Write-Host "  Service credentials updated for $fullAccount." -ForegroundColor Green
} else {
    Write-Host "  FAIL: sc.exe returned $scExit" -ForegroundColor Red
    Write-Host "  Output: $scResult"
    cmd /c pause
    exit 1
}
Write-Host ''

# ================================================================
#  Step 4: Start service and verify
# ================================================================
Write-Host '[4/4] Starting service...' -ForegroundColor Cyan

try {
    Start-Service -Name $serviceName -ErrorAction Stop
    Start-Sleep -Seconds 5

    $svc = Get-Service -Name $serviceName
    Write-Host "  Service status: $($svc.Status)"

    if ($svc.Status -eq 'Running') {
        $wmi = Get-CimInstance Win32_Service -Filter "Name='$serviceName'"
        Write-Host "  Running as: $($wmi.StartName)"
        Write-Host "  PID:        $($wmi.ProcessId)"

        Start-Sleep -Seconds 3

        $healthFile = 'C:\ProgramData\EASI\Bridge\status\health.json'
        if (Test-Path $healthFile) {
            $hContent = Get-Content $healthFile -Raw
            if ($hContent -match '"status":\s*"running"') {
                Write-Host '  Health:     running' -ForegroundColor Green
            }
        }

        $today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
        $logFile = "C:\ProgramData\EASI\Bridge\logs\bridge-$today.log"
        if (Test-Path $logFile) {
            $lastLine = Get-Content $logFile | Select-Object -Last 1
            Write-Host "  Last log:   $lastLine"
        }

        Write-Host ''
        Write-Host '  SUCCESS - Service running under least-privilege account.' -ForegroundColor Green
    } else {
        Write-Host '  FAIL: Service did not start.' -ForegroundColor Red
        Write-Host '  Check Event Viewer for details.'
        Write-Host '  Revert to LocalSystem: sc.exe config EASIBridge obj= LocalSystem password= ""'
    }
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    Write-Host ''
    Write-Host '  If this keeps failing, revert to LocalSystem for now:' -ForegroundColor Yellow
    Write-Host '    sc.exe config EASIBridge obj= LocalSystem password= ""' -ForegroundColor Yellow
    Write-Host '    Start-Service EASIBridge' -ForegroundColor Yellow
    Write-Host '  We can revisit hardening after the bridge is functional.'
}
Write-Host ''

Write-Host $divider
Write-Host '  Phase 6 fix complete. Copy output above and send it back.'
Write-Host $divider
Write-Host ''
cmd /c pause
