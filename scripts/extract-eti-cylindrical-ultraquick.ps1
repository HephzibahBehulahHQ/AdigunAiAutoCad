param([Parameter(Mandatory)][string]$Catalog, [ValidateSet('aR','gR')][string]$Utilization = 'aR')

$ErrorActionPreference = 'Stop'
$settings = [Xml.XmlReaderSettings]::new()
$settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
$reader = [Xml.XmlReader]::Create((Resolve-Path -LiteralPath $Catalog).Path, $settings)
$records = [System.Collections.Generic.List[object]]::new()
$seen = @{}

try {
    while ($reader.Read()) {
        if ($reader.NodeType -ne [Xml.XmlNodeType]::Element -or $reader.LocalName -ne 'PRODUCT') { continue }
        $subtree = $reader.ReadSubtree()
        try { $product = ([Xml.Linq.XDocument]::Load($subtree)).Root }
        finally { $subtree.Dispose() }
        $ns = $product.Name.Namespace
        $code = $product.Element($ns + 'SUPPLIER_PID').Value
        $details = $product.Element($ns + 'PRODUCT_DETAILS')
        if ($code -cnotmatch '^002\d{6}$' -or $details.Element($ns + 'MANUFACTURER_PID').Value -cne $code -or
            $details.Element($ns + 'MANUFACTURER_NAME').Value -cne 'ETI') { continue }
        $name = $details.Element($ns + 'DESCRIPTION_SHORT').Value
        $description = $details.Element($ns + 'DESCRIPTION_LONG').Value
        if ($Utilization -eq 'gR') {
            if ($name -cnotmatch '^Fuse link, CH(10x38|10x85)(SU)? gR (\d+)A/(700|900|1200)V (AC/DC|DC)$') { continue }
            $size = $Matches[1]
            $su = [string]$Matches[2]
            $current = [int]$Matches[3]
            $voltage = [int]$Matches[4]
            $voltageType = $Matches[5]
            $ratings = @(2,4,6,8,10,12,16,20,25)
            $index = [Array]::IndexOf($ratings, $current)
            if ($index -lt 0) { continue }
            # Exact order-code rows in Ultra Quick, PDF pages 13 and 14.
            if ($size -eq '10x38' -and $voltage -in 700,900 -and $voltageType -eq 'AC/DC') {
                $start = if ($su) { 300 } else { 17 }
                if ($voltage -eq 900) { $start += 10 }
                $acCapacity = 50
                $dcCapacity = 8
            } elseif ($size -eq '10x85' -and $voltage -eq 1200 -and $voltageType -eq 'DC') {
                $start = if ($su) { 230 } else { 220 }
                $acCapacity = $null
                $dcCapacity = 30
            } else { continue }
            if ($code -cne ('002625{0:000}' -f ($start + $index)) -or
                $description -cnotmatch "(?:Dimensions|Size) $size," -or $description -cnotmatch "Rated current \(A\) $current(?:/$current)?\s*," -or
                $description -cnotmatch '(?:Characteristics|Time-Current Characteristic) gR,' -or
                $description -cnotmatch "Rated DC voltage \(V\) $voltage(?:/$voltage)?\s*," -or
                $description -cnotmatch "Breaking capacity DC \(kA\) $dcCapacity\s*," -or $description -cnotmatch 'L/R \(ms\) 2\s*,') { continue }
            if ($acCapacity -and ($description -cnotmatch "Rated AC voltage \(V\) $voltage," -or
                $description -cnotmatch "Breaking capacity AC \(kA\) $acCapacity,")) { continue }
            if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
            $seen[$code] = $true
            $capacity = if ($acCapacity) { $acCapacity } else { $dcCapacity }
            $records.Add(@($code, "$size$su", 'gR', $current, $voltage, $capacity, $null, 2, $dcCapacity))
            continue
        }
        if ($name -cnotmatch '^Fuse link, CH((?:10x38|14x51(?:/P)?|22x58(?:/P)?)) aR (\d+)A/(500|600|690)V$') { continue }
        $format = $Matches[1]
        $current = [int]$Matches[2]
        $voltage = [int]$Matches[3]
        $size = $format -replace '/P$', ''
        if ($description -cnotmatch "Dimensions $size," -or $description -cnotmatch "Rated current \(A\) $current," -or
            $description -cnotmatch "Rated AC voltage \(V\) $voltage," -or $description -cnotmatch 'Characteristics aR,' -or
            $description -cnotmatch 'Breaking capacity AC \(kA\) 200,') { continue }
        if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
        $seen[$code] = $true
        $records.Add(@($code, $format, 'aR', $current, $voltage, 200))
    }
} finally {
    $reader.Dispose()
}
ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 3
