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
        if ($code -cnotmatch '^\d{9}$' -or
            $details.Element($ns + 'MANUFACTURER_PID').Value -cne $code -or
            $details.Element($ns + 'MANUFACTURER_NAME').Value -cne 'ETI' -or
            $features.Element($ns + 'REFERENCE_FEATURE_GROUP_ID').Value -cne 'EC000905') { continue }
        $name = $details.Element($ns + 'DESCRIPTION_SHORT').Value
        if ($name -cnotmatch '^RCBO, KZS-4M (3p\+N|3p|2p) (AC|A|B) ([BC])(\d+)/(0[.,]\d+)$') { continue }
        $topology = $Matches[1]
        $residualType = $Matches[2]
        $curve = $Matches[3]
        $current = [int]$Matches[4]
        $trip = [decimal]::Parse($Matches[5].Replace(',', '.'), $culture)
        $protected = [int][string]$topology[0]
        $neutral = $topology.EndsWith('+N')
        $capacity = if ($neutral) { 6 } else { 10 }
        if (($topology -eq '2p') -ne ($residualType -eq 'B')) { continue }
        $description = $details.Element($ns + 'DESCRIPTION_LONG').Value
        $poleDescription = [regex]::Escape($topology.Replace('p', ''))
        if ($description -notmatch "Short circuit capacity \(kA\) $capacity/$capacity(?:,|$)" -or
            $description -notmatch "Number of poles $poleDescription," -or
            $description -cnotmatch "Residual current type $residualType," -or
            $description -notmatch "Rated current \(A\) $current/$current,") { continue }
        $values = @{}
        foreach ($feature in $features.Elements($ns + 'FEATURE')) {
            $values[$feature.Element($ns + 'FNAME').Value] = $feature.Element($ns + 'FVALUE').Value
        }
        $voltage = [int]$values['EF000228']
        $validVoltages = if ($protected -eq 2) { 230,240 } else { 400,415 }
        if ($voltage -notin $validVoltages -or $values['EF002560'] -cnotin $residualType,'Other' -or
            $values['EF000889'] -cne $curve -or $values['EF012628'] -ne [string]$capacity -or
            $values['EF000227'] -ne [string]$current -or
            ($values.ContainsKey('EF005548') -and $values['EF005548'] -ne [string]$protected) -or
            ($values.ContainsKey('EF008618') -and [int]$values['EF008618'] -ne ($protected + [int]$neutral)) -or
            $values['EF002358'] -notmatch '^0[.,]\d+$' -or
            [decimal]::Parse($values['EF002358'].Replace(',', '.'), $culture) -ne $trip) { continue }
        if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
        $seen[$code] = $true
        $records.Add(@($code, $topology, $residualType, $curve, $current, [int]($trip * 1000), $voltage, $capacity))
    }
} finally {
    $reader.Dispose()
}

ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 4
