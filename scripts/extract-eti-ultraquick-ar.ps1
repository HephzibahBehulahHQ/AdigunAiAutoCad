param([Parameter(Mandatory)][string]$Catalog)

$ErrorActionPreference = 'Stop'
$settings = [Xml.XmlReaderSettings]::new()
$settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
$reader = [Xml.XmlReader]::Create((Resolve-Path -LiteralPath $Catalog).Path, $settings)
$records = [System.Collections.Generic.List[object]]::new()
$seen = @{}
$culture = [Globalization.CultureInfo]::InvariantCulture

try {
    while ($reader.Read()) {
        if ($reader.NodeType -ne [Xml.XmlNodeType]::Element -or $reader.LocalName -ne 'PRODUCT') { continue }
        $subtree = $reader.ReadSubtree()
        try { $product = ([Xml.Linq.XDocument]::Load($subtree)).Root }
        finally { $subtree.Dispose() }
        $ns = $product.Name.Namespace
        $code = $product.Element($ns + 'SUPPLIER_PID').Value
        $details = $product.Element($ns + 'PRODUCT_DETAILS')
        $features = $product.Element($ns + 'PRODUCT_FEATURES')
        if ($code -cnotmatch '^004\d{6}$' -or
            $details.Element($ns + 'MANUFACTURER_PID').Value -cne $code -or
            $details.Element($ns + 'MANUFACTURER_NAME').Value -cne 'ETI' -or
            $features.Element($ns + 'REFERENCE_FEATURE_GROUP_ID').Value -cne 'EC000055') { continue }
        $name = $details.Element($ns + 'DESCRIPTION_SHORT').Value
        if ($name -cnotmatch '^Fuse link, (NH(?:000|00|0|[123])|NHG[123](?:/M)?|NHS(?:000/80|00/80|0/108/M10|[123]/(?:80|110)(?:/M)?))(?: (UQ01|UQ02|UQ1))? aR (\d+(?:[.,]\d+)?)A/(500|690|1000)V$') { continue }
        $format = $Matches[1]
        $series = [string]$Matches[2]
        $current = [decimal]::Parse($Matches[3].Replace(',', '.'), $culture)
        $voltage = [int]$Matches[4]
        $size = $format -replace '^NH[GS]', 'NH' -replace '/.*$', ''
        $micro = $format.EndsWith('/M')
        $page = switch -Regex ($format) {
            '^NHG[123]' {
                if ($voltage -eq 1000 -and $series -eq 'UQ01') { 34 }
                elseif ($voltage -eq 690 -or ($voltage -eq 500 -and $code -in '004375535','004745636')) {
                    if ($micro) { 27 } else { 26 }
                }
            }
            '^NHS[123]/110' {
                if ($voltage -eq 1000 -and $series -eq 'UQ01') { 33 }
                elseif ($voltage -eq 690) { 25 }
            }
            '^NHS[123]/80' { if ($voltage -eq 690) { 24 } }
            '^NHS0{2,3}/80$' {
                if ($voltage -eq 1000 -and $size -eq 'NH00' -and $series -eq 'UQ01' -and $code -ne '004301121') { 31 }
                elseif ($voltage -eq 690 -or $code -eq '004371123') { 23 }
            }
            '^NHS0/108/M10$' { if ($voltage -eq 1000 -and !$series) { 32 } }
            '^NH00$' { if ($voltage -eq 690) { 21 } }
            '^NH0$' { if ($voltage -eq 1000 -and $series -eq 'UQ1') { 28 } }
            '^NH[123]$' {
                if ($voltage -eq 690 -and $series -eq 'UQ02') { 22 }
                elseif ($voltage -eq 1000 -and $series -eq 'UQ01') { 29 }
            }
        }
        if (!$page -or (!$series -and $format -ne 'NHS0/108/M10')) { continue }
        $description = $details.Element($ns + 'DESCRIPTION_LONG').Value
        $type = if ($format.StartsWith('NHG')) { 'NH-G' } elseif ($format.StartsWith('NHS')) { 'NH-S' } else { 'NH' }
        if (($description -match 'Fuse type ' -and $description -cnotmatch "Fuse type $type,") -or
            $description -notmatch "Size $size," -or
            $description -notmatch 'Breaking capacity AC \(kA\) 200,' -or
            $description -notmatch "Rated AC voltage \(V\) $voltage/$voltage(?:,|$)" -or
            $description -cnotmatch 'Time-Current Characteristic aR' -or
            ($micro -and $description -notmatch 'Indicator Centre trip indicator for MK')) { continue }
        $values = @{}
        foreach ($feature in $features.Elements($ns + 'FEATURE')) {
            $values[$feature.Element($ns + 'FNAME').Value] = $feature.Element($ns + 'FVALUE').Value
        }
        if ($values['EF000187'] -cne 'AC' -or $values['EF015865'] -cne $size -or
            $values['EF017698'] -ne '200' -or $values['EF007682'] -ne [string]$voltage -or
            $values['EF002572'] -cnotmatch '^aR\s' -or $values['EF000227'] -notmatch '^\d+(?:[.,]\d+)?$' -or
            [decimal]::Parse($values['EF000227'].Replace(',', '.'), $culture) -ne $current) { continue }
        if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
        $seen[$code] = $true
        $records.Add(@($code, $format, $series, $current, $voltage, [int]$page))
    }
} finally {
    $reader.Dispose()
}
ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 3

