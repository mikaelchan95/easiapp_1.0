<#
    AutoCount Discovery Part 2 - Get database name and verify connection
    Quick script - copy output and send it back.
#>

$ErrorActionPreference = 'Continue'
$divider = '=' * 60

Write-Host ''
Write-Host $divider
Write-Host '  AutoCount Discovery Part 2'
Write-Host $divider
Write-Host ''

# 1. Read the AutoCount config file
Write-Host '[1] AutoCount config file contents' -ForegroundColor Cyan
$configPath = 'C:\ProgramData\AutoCount\Accounting 2\A2006.config'
if (Test-Path $configPath) {
    Write-Host "  Path: $configPath"
    Write-Host '  Contents:'
    Get-Content $configPath | ForEach-Object { Write-Host "    $_" }
} else {
    Write-Host '  Config file not found.'
}
Write-Host ''

# 2. List all AutoCount config files
Write-Host '[2] All AutoCount config/data files' -ForegroundColor Cyan
Get-ChildItem 'C:\ProgramData\AutoCount' -Recurse -File -ErrorAction SilentlyContinue |
    ForEach-Object {
        Write-Host "  $($_.FullName)  ($($_.Length) bytes)"
        if ($_.Extension -match '\.(config|xml|ini|json)$' -and $_.Length -lt 2000) {
            Get-Content $_.FullName -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "    $_" }
            Write-Host ''
        }
    }
Write-Host ''

# 3. Fixed SQL query for databases
Write-Host '[3] SQL Server databases' -ForegroundColor Cyan
$sqlInstance = 'DESKTOP-20COQHQ\A2006'
try {
    $connStr = "Data Source=$sqlInstance;Integrated Security=True;Connection Timeout=10"
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
    $conn.Open()

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = 'SELECT d.name, d.create_date, d.state_desc FROM sys.databases d WHERE d.name NOT IN (''master'',''tempdb'',''model'',''msdb'') ORDER BY d.name'
    $reader = $cmd.ExecuteReader()

    $dbNames = @()
    while ($reader.Read()) {
        $dbName = $reader['name'].ToString()
        $created = ([DateTime]$reader['create_date']).ToString('yyyy-MM-dd')
        $state = $reader['state_desc']
        Write-Host "  $dbName  (created: $created, state: $state)"
        $dbNames += $dbName
    }
    $reader.Close()

    # Check each database for AutoCount tables
    Write-Host ''
    Write-Host '  AutoCount table check:' -ForegroundColor Cyan
    foreach ($db in $dbNames) {
        try {
            $cmd2 = $conn.CreateCommand()
            $cmd2.CommandText = "SELECT COUNT(*) FROM [$db].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('Debtor','Creditor','SalesInvoice','ARInvoice','Account','AccType','Item')"
            $count = $cmd2.ExecuteScalar()
            if ($count -gt 0) {
                Write-Host "  ** $db => $count AutoCount tables found **" -ForegroundColor Green

                # List some debtor data (just count + first few codes, NO financial data)
                try {
                    $cmd3 = $conn.CreateCommand()
                    $cmd3.CommandText = "SELECT COUNT(*) FROM [$db].[dbo].[Debtor]"
                    $debtorCount = $cmd3.ExecuteScalar()
                    Write-Host "     Debtor count: $debtorCount"

                    $cmd4 = $conn.CreateCommand()
                    $cmd4.CommandText = "SELECT TOP 5 AccNo, CompanyName FROM [$db].[dbo].[Debtor] ORDER BY AccNo"
                    $r = $cmd4.ExecuteReader()
                    Write-Host '     First 5 debtors:'
                    while ($r.Read()) {
                        Write-Host "       $($r['AccNo']) - $($r['CompanyName'])"
                    }
                    $r.Close()
                } catch {
                    Write-Host "     Could not query debtors: $_"
                }
            } else {
                Write-Host "  $db => $count matching tables"
            }
        } catch {
            Write-Host "  $db => error: $_"
        }
    }

    $conn.Close()
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
}
Write-Host ''

# 4. Check DBServerType enum values
Write-Host '[4] DBServerType enum values' -ForegroundColor Cyan
$acPath = 'C:\Program Files\AutoCount\Accounting 2.1'
try {
    $asm = [System.Reflection.Assembly]::LoadFrom((Join-Path $acPath 'AutoCount.dll'))
    $dbServerType = $asm.GetType('AutoCount.Data.DBServerType')
    if ($dbServerType) {
        [System.Enum]::GetNames($dbServerType) | ForEach-Object { Write-Host "  $_" }
    }
} catch {
    Write-Host "  Could not load: $_"
}
Write-Host ''

Write-Host $divider
Write-Host '  Copy everything above and send it back.'
Write-Host $divider
Write-Host ''
cmd /c pause
