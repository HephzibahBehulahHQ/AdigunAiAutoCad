param([Parameter(Mandatory)][string]$Catalog)

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
        if ($code -cnotmatch '^0024429(?:[01]\d|[4-7]\d)$' -or
            $details.Element($ns + 'MANUFACTURER_PID').Value -cne $code -or
            $details.Element($ns + 'MANUFACTURER_NAME').Value -cne 'ETI') { continue }
        $name = $details.Element($ns + 'DESCRIPTION_SHORT').Value
        if ($name -cnotmatch '^Surge arrester, ETITEC V (T12|T2|2T2|2T3) (\d+)/(12,5|20|5) ([1-4]\+[01])( RC)?$') { continue }
        $series = $Matches[1]
        $voltage = [int]$Matches[2]
        $ratedMarking = $Matches[3]
        $topology = $Matches[4]
        $alarm = [bool]$Matches[5]
        $suffix = [int]$code.Substring(7)
        $expectedSeries = if ($suffix -lt 20) { 'T12' } elseif ($suffix -lt 52) { '2T2' } elseif ($suffix -lt 68) { 'T2' } else { '2T3' }
        $expectedAlarm = $suffix -in (10..19 + 46..51 + 58..67 + 74..79)
        $expectedMarking = if ($series -eq 'T12') { '12,5' } elseif ($series -eq '2T3') { '5' } else { '20' }
        if ($series -cne $expectedSeries -or $alarm -ne $expectedAlarm -or $ratedMarking -cne $expectedMarking) { continue }
        $description = $details.Element($ns + 'DESCRIPTION_LONG').Value
        if ($description -notmatch 'Function SPD' -or
            $description -notmatch "(?:Operating Voltage AC \(V\)|operating voltage Uc) $voltage(?:\s|,)") { continue }
        if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
        $seen[$code] = $true
        $records.Add(@($code, $series, $voltage, $topology, $alarm))
    }
} finally {
    $reader.Dispose()
}

ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 4
