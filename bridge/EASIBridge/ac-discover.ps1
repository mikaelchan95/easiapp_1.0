<#
    AutoCount SDK Discovery Script
    Loads the AutoCount DLLs via reflection and maps the API surface.
    Also queries the SQL instance for database names.
    
    Run on the server PC (no admin required).
    Copy ALL output and send it back.
#>

$ErrorActionPreference = 'Continue'
$divider = '=' * 60

Write-Host ''
Write-Host $divider
Write-Host '  AutoCount SDK Discovery'
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host $divider
Write-Host ''

$acPath = 'C:\Program Files\AutoCount\Accounting 2.1'

# ================================================================
#  1. List all DLLs in AutoCount install directory
# ================================================================
Write-Host '[1] AutoCount DLLs' -ForegroundColor Cyan

$allDlls = Get-ChildItem "$acPath\*.dll" -ErrorAction SilentlyContinue | Sort-Object Name
Write-Host "  Total DLLs: $($allDlls.Count)"
Write-Host ''
Write-Host '  AutoCount-prefixed DLLs:'
$acDlls = $allDlls | Where-Object { $_.Name -like 'AutoCount*' }
foreach ($dll in $acDlls) {
    Write-Host "    $($dll.Name)  ($($dll.Length) bytes)"
}
Write-Host ''
Write-Host '  BCE-prefixed DLLs:'
$bceDlls = $allDlls | Where-Object { $_.Name -like 'BCE*' }
foreach ($dll in $bceDlls) {
    Write-Host "    $($dll.Name)  ($($dll.Length) bytes)"
}
Write-Host ''

# ================================================================
#  2. Load key DLLs and discover types
# ================================================================
Write-Host '[2] SDK Type Discovery' -ForegroundColor Cyan

$keyDlls = @(
    'AutoCount.dll',
    'AutoCount.Data.dll',
    'AutoCount.Accounting.dll',
    'AutoCount.MainEntry.dll',
    'AutoCount.Authentication.dll'
)

foreach ($dllName in $keyDlls) {
    $dllPath = Join-Path $acPath $dllName
    if (-not (Test-Path $dllPath)) {
        Write-Host "  SKIP: $dllName not found" -ForegroundColor Yellow
        continue
    }

    Write-Host "  --- $dllName ---" -ForegroundColor Green
    try {
        $asm = [System.Reflection.Assembly]::LoadFrom($dllPath)
        $types = $asm.GetExportedTypes() | Sort-Object FullName

        # Show namespaces
        $namespaces = $types | ForEach-Object { $_.Namespace } | Sort-Object -Unique
        Write-Host "  Namespaces:"
        foreach ($ns in $namespaces) {
            if ($ns) { Write-Host "    $ns" }
        }
        Write-Host ''

        # Show key types related to session, connection, authentication, debtor
        $interestingPatterns = @('Session', 'Login', 'Connect', 'Database', 'DBSetting', 'Debtor', 'Account', 'UserSession', 'Command', 'Query')
        $interestingTypes = $types | Where-Object {
            $name = $_.Name
            $found = $false
            foreach ($p in $interestingPatterns) {
                if ($name -match $p) { $found = $true; break }
            }
            $found
        }

        if ($interestingTypes) {
            Write-Host '  Key types:'
            foreach ($t in $interestingTypes) {
                $kind = if ($t.IsClass) { 'class' } elseif ($t.IsInterface) { 'interface' } elseif ($t.IsEnum) { 'enum' } else { 'type' }
                Write-Host "    [$kind] $($t.FullName)"

                # Show public methods for session/connection types
                if ($t.Name -match 'Session|DBSetting|Login|Connect|Database') {
                    $methods = $t.GetMethods([System.Reflection.BindingFlags]::Public -bor [System.Reflection.BindingFlags]::Instance -bor [System.Reflection.BindingFlags]::Static) |
                        Where-Object { $_.DeclaringType -eq $t } |
                        Sort-Object Name
                    if ($methods) {
                        foreach ($m in $methods) {
                            $params = ($m.GetParameters() | ForEach-Object { "$($_.ParameterType.Name) $($_.Name)" }) -join ', '
                            Write-Host "      $($m.ReturnType.Name) $($m.Name)($params)"
                        }
                    }

                    # Show constructors
                    $ctors = $t.GetConstructors()
                    foreach ($c in $ctors) {
                        $params = ($c.GetParameters() | ForEach-Object { "$($_.ParameterType.Name) $($_.Name)" }) -join ', '
                        Write-Host "      .ctor($params)"
                    }

                    # Show public properties
                    $props = $t.GetProperties() | Where-Object { $_.DeclaringType -eq $t } | Sort-Object Name
                    foreach ($p in $props) {
                        $acc = @()
                        if ($p.CanRead) { $acc += 'get' }
                        if ($p.CanWrite) { $acc += 'set' }
                        Write-Host "      $($p.PropertyType.Name) $($p.Name) { $($acc -join '; ') }"
                    }
                }
                Write-Host ''
            }
        }
    } catch {
        Write-Host "  ERROR loading $dllName : $_" -ForegroundColor Red

        # Try to load dependencies
        if ($_.Exception.Message -match 'Could not load file or assembly') {
            Write-Host '  Attempting to pre-load dependencies...' -ForegroundColor Yellow
            $allAcDlls = Get-ChildItem "$acPath\*.dll" -ErrorAction SilentlyContinue
            foreach ($dep in $allAcDlls) {
                try {
                    [System.Reflection.Assembly]::LoadFrom($dep.FullName) | Out-Null
                } catch { }
            }
            Write-Host '  Dependencies loaded. Retrying...'
            try {
                $asm = [System.Reflection.Assembly]::LoadFrom($dllPath)
                $types = $asm.GetExportedTypes() | Sort-Object FullName
                $namespaces = $types | ForEach-Object { $_.Namespace } | Sort-Object -Unique
                Write-Host "  Namespaces:"
                foreach ($ns in $namespaces) {
                    if ($ns) { Write-Host "    $ns" }
                }
            } catch {
                Write-Host "  Still failed: $_" -ForegroundColor Red
            }
        }
    }
    Write-Host ''
}

# ================================================================
#  3. Search for additional session/connection types across ALL DLLs
# ================================================================
Write-Host '[3] Broad search for Session/Connection types across all DLLs' -ForegroundColor Cyan

# Pre-load everything first
$allAcDlls = Get-ChildItem "$acPath\*.dll" -ErrorAction SilentlyContinue
foreach ($dll in $allAcDlls) {
    try {
        [System.Reflection.Assembly]::LoadFrom($dll.FullName) | Out-Null
    } catch { }
}

foreach ($dll in $acDlls) {
    try {
        $asm = [System.Reflection.Assembly]::LoadFrom($dll.FullName)
        $sessionTypes = $asm.GetExportedTypes() | Where-Object {
            $_.Name -match 'Session|DBSetting|Login|UserSession'
        }
        foreach ($t in $sessionTypes) {
            Write-Host "  $($dll.Name) => $($t.FullName)" -ForegroundColor Green
        }
    } catch { }
}
Write-Host ''

# ================================================================
#  4. Query SQL Server for database names
# ================================================================
Write-Host '[4] SQL Server Databases on A2006 instance' -ForegroundColor Cyan

$sqlInstance = 'DESKTOP-20COQHQ\A2006'
try {
    $connStr = "Data Source=$sqlInstance;Integrated Security=True;Connection Timeout=10"
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
    $conn.Open()
    Write-Host "  Connected to $sqlInstance" -ForegroundColor Green

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @'
SELECT 
    name, 
    create_date, 
    state_desc,
    CAST(SUM(size) * 8.0 / 1024 AS DECIMAL(10,2)) AS size_mb
FROM sys.databases d
LEFT JOIN sys.master_files f ON d.database_id = f.database_id
WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
GROUP BY name, create_date, state_desc
ORDER BY name
'@

    $reader = $cmd.ExecuteReader()
    Write-Host ''
    Write-Host '  User databases:'
    while ($reader.Read()) {
        $name = $reader['name']
        $created = ([DateTime]$reader['create_date']).ToString('yyyy-MM-dd')
        $state = $reader['state_desc']
        $sizeMb = $reader['size_mb']
        Write-Host "    $name  (created: $created, state: $state, size: ${sizeMb}MB)"
    }
    $reader.Close()

    # Also check for AutoCount-specific tables in each user database
    Write-Host ''
    Write-Host '  Checking for AutoCount tables in each database:'

    $cmd2 = $conn.CreateCommand()
    $cmd2.CommandText = "SELECT name FROM sys.databases WHERE name NOT IN ('master','tempdb','model','msdb') AND state = 0"
    $dbReader = $cmd2.ExecuteReader()
    $dbNames = @()
    while ($dbReader.Read()) { $dbNames += $dbReader['name'].ToString() }
    $dbReader.Close()

    foreach ($db in $dbNames) {
        try {
            $cmd3 = $conn.CreateCommand()
            $cmd3.CommandText = "SELECT COUNT(*) FROM [$db].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('Debtor','Creditor','SalesInvoice','ARInvoice','Account','AccType')"
            $acTableCount = $cmd3.ExecuteScalar()
            $marker = if ($acTableCount -gt 0) { "** AUTOCOUNT DB ($acTableCount matching tables) **" } else { '' }
            Write-Host "    $db => $acTableCount accounting tables $marker"
        } catch {
            Write-Host "    $db => could not query"
        }
    }

    $conn.Close()
} catch {
    Write-Host "  FAIL connecting to SQL: $_" -ForegroundColor Red
    Write-Host "  Instance: $sqlInstance"
    Write-Host ''
    Write-Host '  If Windows Auth fails, AutoCount may use SQL Auth.' -ForegroundColor Yellow
    Write-Host '  Check AutoCount > File > Database Setup for connection details.'
}
Write-Host ''

# ================================================================
#  5. Check AutoCount config files for database connection hints
# ================================================================
Write-Host '[5] AutoCount configuration files' -ForegroundColor Cyan

$configFiles = @(
    (Join-Path $acPath 'AutoCount.MainEntry.exe.config'),
    (Join-Path $acPath 'AutoCount.exe.config'),
    (Join-Path $acPath 'app.config')
)

foreach ($cf in $configFiles) {
    if (Test-Path $cf) {
        Write-Host "  Found: $cf" -ForegroundColor Green
        $content = Get-Content $cf -Raw -ErrorAction SilentlyContinue
        # Look for connection strings
        if ($content -match 'connectionString|Data Source|Initial Catalog|Server=') {
            Write-Host '  Contains connection string references.'
            # Extract connection-related lines (sanitize passwords)
            $lines = Get-Content $cf
            foreach ($line in $lines) {
                if ($line -match 'connectionString|Data Source|Initial Catalog|Server=|database=') {
                    $sanitized = $line -replace 'Password=[^;]*', 'Password=***'
                    $sanitized = $sanitized -replace 'Pwd=[^;]*', 'Pwd=***'
                    Write-Host "    $($sanitized.Trim())"
                }
            }
        }
        Write-Host ''
    }
}

# Also check common AutoCount data folders
$acDataPaths = @(
    "$env:ProgramData\AutoCount",
    "$env:APPDATA\AutoCount",
    "$env:LOCALAPPDATA\AutoCount"
)
foreach ($dp in $acDataPaths) {
    if (Test-Path $dp) {
        Write-Host "  Data folder: $dp" -ForegroundColor Green
        Get-ChildItem $dp -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Extension -match '\.(config|xml|json|ini|txt)$' } |
            Select-Object -First 10 |
            ForEach-Object { Write-Host "    $($_.FullName)  ($($_.Length) bytes)" }
        Write-Host ''
    }
}
Write-Host ''

Write-Host $divider
Write-Host '  DISCOVERY COMPLETE - copy everything above and send it back.'
Write-Host $divider
Write-Host ''
cmd /c pause
