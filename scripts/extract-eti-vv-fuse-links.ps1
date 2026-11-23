param([Parameter(Mandatory)][string]$Catalog)

$ErrorActionPreference = 'Stop'
$settings = [Xml.XmlReaderSettings]::new()
$settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
$reader = [Xml.XmlReader]::Create((Resolve-Path -LiteralPath $Catalog).Path, $settings)
$records = [System.Collections.Generic.List[object]]::new()
$seen = @{}
$culture = [Globalization.CultureInfo]::InvariantCulture
$number = '\d+(?:[.,]\d+)?'

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
        if ($code -cnotmatch '^0042\d{5}$' -or
            $details.Element($ns + 'MANUFACTURER_PID').Value -cne $code -or
            $details.Element($ns + 'MANUFACTURER_NAME').Value -cne 'ETI' -or
            $features.Element($ns + 'REFERENCE_FEATURE_GROUP_ID').Value -cne 'EC003507') { continue }
        $name = $details.Element($ns + 'DESCRIPTION_SHORT').Value
        if ($name -cnotmatch "^Fuse link, (VVC3|VVT-D3) ($number)kV/(${number})A(?: (\d+))?$") { continue }
        $series = $Matches[1]
        $kilovolts = [double]::Parse($Matches[2].Replace(',', '.'), $culture)
        $current = [double]::Parse($Matches[3].Replace(',', '.'), $culture)
        $namedSize = $Matches[4]
        $description = $details.Element($ns + 'DESCRIPTION_LONG').Value
        $strikeForce = if ($series -eq 'VVC3') { 50 } else { 80 }
        if ($description -notmatch "Indicator (?:Temperature limiter, )?${strikeForce}N striker force," -or
            $description -notmatch "Breaking capacity AC \(kA\) ($number)," ) { continue }
        $capacity = [double]::Parse($Matches[1].Replace(',', '.'), $culture)
        if ($description -notmatch 'Size (\d+),' ) { continue }
        $size = [int]$Matches[1]
        if ($namedSize -and [int]$namedSize -ne $size) { continue }
        if ($description -notmatch "Rated minimum breaking current \(A\) ($number)(?:,|$)") { continue }
        $minCurrent = [double]::Parse($Matches[1].Replace(',', '.'), $culture)
        $volts = [int]($kilovolts * 1000)
        if ($description -notmatch "Rated AC voltage \(V\) $volts,") { continue }
        $values = @{}
        foreach ($feature in $features.Elements($ns + 'FEATURE')) {
            $values[$feature.Element($ns + 'FNAME').Value] = $feature.Element($ns + 'FVALUE').Value
        }
        if ($values['EF000187'] -cne 'AC' -or $values['EF012539'] -cne 'Back-up' -or $values['EF008175'] -cne 'true' -or
            $values['EF001438'] -ne [string]$size -or $values['EF000551'] -notmatch "^$number$" -or
            $values['EF000228'] -notmatch "^$number$" -or $values['EF005617'] -notmatch "^$number$" -or $values['EF000227'] -notmatch "^$number$") { continue }
        if ([double]::Parse($values['EF000228'].Replace(',', '.'), $culture) -ne $kilovolts -or
            [double]::Parse($values['EF005617'].Replace(',', '.'), $culture) -ne $capacity -or
            [double]::Parse($values['EF000227'].Replace(',', '.'), $culture) -ne $current) { continue }
        $diameter = [double]::Parse($values['EF000551'].Replace(',', '.'), $culture)
        if ($size -notin 192,292,367,442,537 -or $diameter -notin 53,68,83.5) { continue }
        # Use the e + 33 + 33 outline only when ETI references this drawing on the exact order code.
        if (-not ($product.Descendants($ns + 'UDX.EDXF.MIME_SOURCE').Value -contains '/product_db/levels/2241/en-GB/dimension/2241_dimension.jpg')) { continue }
        if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
        $seen[$code] = $true
        $records.Add(@($code, $series, $kilovolts, $current, $capacity, $size, $diameter, $minCurrent))
    }
} finally {
    $reader.Dispose()
}

ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 4
