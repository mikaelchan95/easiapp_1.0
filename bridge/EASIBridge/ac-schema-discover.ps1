<#
    AutoCount Schema Discovery
    Queries the actual database for column names and types on key tables.
    Run on the Epico PC as User (Windows Auth to SQL).
    Saves output to ac-schema-reference.txt in the same folder.
#>

$ErrorActionPreference = 'Continue'
$divider = '=' * 60
$sqlInstance = 'DESKTOP-20COQHQ\A2006'
$database = 'AED_EPICO'
$outFile = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) 'ac-schema-reference.txt'

$tables = @(
    'Debtor',
    'Creditor',
    'Item',
    'ItemGroup',
    'ItemUOM',
    'ARInvoice',
    'ARInvoiceDetail',
    'AROfficialReceipt',
    'AROfficialReceiptDetail',
    'SalesOrder',
    'SalesOrderDetail',
    'DeliveryOrder',
    'DeliveryOrderDetail',
    'Account',
    'AccType',
    'CreditTerm',
    'PaymentMethod',
    'Tax',
    'Currency',
    'Branch',
    'Department'
)

$output = @()
$output += $divider
$output += "  AutoCount Schema Reference"
$output += "  Instance: $sqlInstance"
$output += "  Database: $database"
$output += "  Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$output += $divider
$output += ''

try {
    $connStr = "Data Source=$sqlInstance;Initial Catalog=$database;Integrated Security=True;Connection Timeout=10"
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
    $conn.Open()
    Write-Host "Connected to $sqlInstance / $database" -ForegroundColor Green

    foreach ($table in $tables) {
        $line = "--- $table ---"
        Write-Host $line -ForegroundColor Cyan
        $output += $line

        try {
            $cmd = $conn.CreateCommand()
            $cmd.CommandText = @"
SELECT c.COLUMN_NAME, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH, c.IS_NULLABLE, c.COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.TABLE_NAME = '$table'
ORDER BY c.ORDINAL_POSITION
"@
            $reader = $cmd.ExecuteReader()
            $colCount = 0
            while ($reader.Read()) {
                $colName = $reader['COLUMN_NAME'].ToString()
                $dataType = $reader['DATA_TYPE'].ToString()
                $maxLen = $reader['CHARACTER_MAXIMUM_LENGTH']
                $nullable = $reader['IS_NULLABLE'].ToString()
                $typeStr = $dataType
                if ($maxLen -ne $null -and $maxLen -ne [System.DBNull]::Value) {
                    $typeStr += "($maxLen)"
                }
                $nullStr = if ($nullable -eq 'YES') { 'NULL' } else { 'NOT NULL' }
                $desc = "  $colName  $typeStr  $nullStr"
                Write-Host $desc
                $output += $desc
                $colCount++
            }
            $reader.Close()

            if ($colCount -eq 0) {
                $msg = "  (table not found or no columns)"
                Write-Host $msg -ForegroundColor Yellow
                $output += $msg
            } else {
                # Row count
                try {
                    $cmd2 = $conn.CreateCommand()
                    $cmd2.CommandText = "SELECT COUNT(*) FROM [$table]"
                    $rowCount = $cmd2.ExecuteScalar()
                    $rowMsg = "  => $rowCount rows"
                    Write-Host $rowMsg -ForegroundColor Green
                    $output += $rowMsg
                } catch {
                    $output += "  => (could not count rows)"
                }
            }
        } catch {
            $errMsg = "  ERROR: $_"
            Write-Host $errMsg -ForegroundColor Red
            $output += $errMsg
        }
        $output += ''
        Write-Host ''
    }

    $conn.Close()
} catch {
    $errMsg = "Connection failed: $_"
    Write-Host $errMsg -ForegroundColor Red
    $output += $errMsg
}

$output += $divider
$output += '  Schema discovery complete.'
$output += $divider

$output | Out-File -FilePath $outFile -Encoding UTF8
Write-Host "Saved to: $outFile" -ForegroundColor Green
Write-Host ''
cmd /c pause
