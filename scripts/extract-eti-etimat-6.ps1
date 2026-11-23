param([Parameter(Mandatory)][string]$Catalog)

$ErrorActionPreference = 'Stop'
$settings = [Xml.XmlReaderSettings]::new()
$settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
$reader = [Xml.XmlReader]::Create((Resolve-Path -LiteralPath $Catalog).Path, $settings)
$seen = @{}
$records = [System.Collections.Generic.List[object]]::new()

try {
    while ($reader.Read()) {
        if ($reader.NodeType -ne [Xml.XmlNodeType]::Element -or $reader.LocalName -ne 'PRODUCT') { continue }
        $subtree = $reader.ReadSubtree()
        try { $product = ([Xml.Linq.XDocument]::Load($subtree)).Root }
        finally { $subtree.Dispose() }
        $ns = $product.Name.Namespace
        $id = $product.Element($ns + 'SUPPLIER_PID').Value
        $details = $product.Element($ns + 'PRODUCT_DETAILS')
        $features = $product.Element($ns + 'PRODUCT_FEATURES')
        if ($id -cnotmatch '^\d{9}$' -or $details.Element($ns + 'MANUFACTURER_PID').Value -cne $id -or
            $details.Element($ns + 'MANUFACTURER_NAME').Value -cne 'ETI' -or
            $features.Element($ns + 'REFERENCE_FEATURE_GROUP_ID').Value -cne 'EC000042') { continue }
        $short = $details.Element($ns + 'DESCRIPTION_SHORT').Value
        if ($short -cnotmatch '^(?:Miniature circuit breaker, )?ETIMAT 6 (1p\+N|3p\+N|[123]p) ([BCD])\s*(\d+(?:[.,]\d+)?)$') { continue }
        $topology = $Matches[1]
        $curve = $Matches[2]
        $current = [double]::Parse($Matches[3].Replace(',', '.'), [Globalization.CultureInfo]::InvariantCulture)
        $protected = [int][string]$topology[0]
        $neutral = $topology.EndsWith('+N')
        $poles = $protected + [int]$neutral
        $long = $details.Element($ns + 'DESCRIPTION_LONG').Value
        $values = @{}
        foreach ($feature in $features.Elements($ns + 'FEATURE')) {
            $values[$feature.Element($ns + 'FNAME').Value] = @($feature.Elements($ns + 'FVALUE') | ForEach-Object Value)
        }
        $width = @{ 1 = 17.6; 2 = 35.4; 3 = 53.4; 4 = 71 }[$poles]
        $voltage = if ($topology -eq '1p') { '230/400' } elseif ($topology -eq '1p+N') { '230' } else { '400' }
        if ($values['EF000889'][0] -cne $curve -or $values['EF000187'][0] -cne 'AC' -or
            $values['EF000227'][0] -notmatch '^\d+(?:[.,]\d+)?$' -or
            [double]::Parse($values['EF000227'][0].Replace(',', '.'), [Globalization.CultureInfo]::InvariantCulture) -ne $current -or
            [int]$values['EF005548'][0] -ne $protected -or [int]$values['EF008618'][0] -ne $poles -or
            $long -notmatch 'Short circuit capacity \(kA\) 6(?:/6)?(?:\s|,|$)' -or $current -lt 0.5 -or $current -gt 63) { continue }
        if ($seen.ContainsKey($id)) { throw "Duplicate ETI order code $id" }
        $seen[$id] = $true
        $records.Add(@($id, $topology, $curve, $current, $voltage, $width))
    }
} finally {
    $reader.Dispose()
}

ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 4
