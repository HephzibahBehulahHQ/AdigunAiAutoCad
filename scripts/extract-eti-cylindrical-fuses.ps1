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
        if ($code -cnotmatch '^00265[12]\d{3}$' -or
            $details.Element($ns + 'MANUFACTURER_PID').Value -cne $code -or
            $details.Element($ns + 'MANUFACTURER_NAME').Value -cne 'ETI' -or
            $features.Element($ns + 'REFERENCE_FEATURE_GROUP_ID').Value -cne 'EC002704') { continue }
        $name = $details.Element($ns + 'DESCRIPTION_SHORT').Value
        if ($name -cnotmatch '^Fuse link, CH(8x32|10x38|14x51|22x58) (gG|aM) (\d+(?:[.,]\d+)?)A/(\d+)V$') { continue }
        $size = $Matches[1]
        $category = $Matches[2]
        $current = [double]::Parse($Matches[3].Replace(',', '.'), $culture)
        $voltage = [int]$Matches[4]
        $capacity = if ($size -eq '8x32') { 20 } else { 120 }
        $physicalSize = if ($size -eq '8x32') { '8x3[12]' } else { $size }
        $description = $details.Element($ns + 'DESCRIPTION_LONG').Value
        if ($description -notmatch "Breaking capacity AC \(kA\) $capacity," -or
            $description -notmatch "Size $physicalSize," -or
            $description -cnotmatch "(?:Time-Current Characteristic|Characteristics) $category(?:,|$)") { continue }
        $values = @{}
        foreach ($feature in $features.Elements($ns + 'FEATURE')) {
            $values[$feature.Element($ns + 'FNAME').Value] = $feature.Element($ns + 'FVALUE').Value
        }
        if ($values['EF000187'] -cne 'AC' -or
            $values['EF005617'] -ne [string]$capacity -or $values['EF000228'] -ne [string]$voltage -or
            $values['EF000227'] -notmatch '^\d+(?:[.,]\d+)?$' -or
            [double]::Parse($values['EF000227'].Replace(',', '.'), $culture) -ne $current) { continue }
        if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
        $seen[$code] = $true
        $records.Add(@($code, $size, $category, $current, $voltage, $capacity))
    }
} finally {
    $reader.Dispose()
}

ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 4
