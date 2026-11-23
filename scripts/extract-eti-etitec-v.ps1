param([Parameter(Mandatory)][string]$Catalog, [ValidateSet('V','C-CM')][string]$Family = 'V')

$ErrorActionPreference = 'Stop'
$settings = [Xml.XmlReaderSettings]::new()
$settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
$reader = [Xml.XmlReader]::Create((Resolve-Path -LiteralPath $Catalog).Path, $settings)
$records = [System.Collections.Generic.List[object]]::new()
$seen = @{}
$codePattern = if ($Family -eq 'V') { '^0024429(?:[01]\d|[4-7]\d)$' } else { '^002440(?:39[3-9]|40\d|41[0-3]|65[0-7])$' }

try {
    while ($reader.Read()) {
        if ($reader.NodeType -ne [Xml.XmlNodeType]::Element -or $reader.LocalName -ne 'PRODUCT') { continue }
        $subtree = $reader.ReadSubtree()
        try { $product = ([Xml.Linq.XDocument]::Load($subtree)).Root }
        finally { $subtree.Dispose() }
        $ns = $product.Name.Namespace
        $code = $product.Element($ns + 'SUPPLIER_PID').Value
        $details = $product.Element($ns + 'PRODUCT_DETAILS')
        if ($code -cnotmatch $codePattern -or
            $details.Element($ns + 'MANUFACTURER_PID').Value -cne $code -or
            $details.Element($ns + 'MANUFACTURER_NAME').Value -cne 'ETI') { continue }
        $name = $details.Element($ns + 'DESCRIPTION_SHORT').Value
        if ($Family -eq 'V') {
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
        } else {
            if ($name -cnotmatch '^Surge arrester, ETITEC (C T2|CM T23) (255|275|440)/20 (G|[1-4]\+[01])( RC)?$') { continue }
            $series = $Matches[1]
            $voltage = [int]$Matches[2]
            $topology = $Matches[3]
            $alarm = [bool]$Matches[4]
            $suffix = [int]$code.Substring(6)
            $expectedSeries = if ($suffix -lt 650) { 'C T2' } else { 'CM T23' }
            $expectedAlarm = ($suffix -in 393..412 -and $suffix % 2 -eq 0) -or ($suffix -ge 650 -and $suffix % 2 -eq 1)
            if ($series -cne $expectedSeries -or $alarm -ne $expectedAlarm -or ($suffix -eq 413) -ne ($topology -eq 'G')) { continue }
        }
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
