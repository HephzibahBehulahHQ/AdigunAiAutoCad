param([Parameter(Mandatory)][string]$Catalog, [ValidateSet('4M','2M','2M2p','1M-UNI')][string]$Series = '4M')

$ErrorActionPreference = 'Stop'
$settings = [Xml.XmlReaderSettings]::new()
$settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
$reader = [Xml.XmlReader]::Create((Resolve-Path -LiteralPath $Catalog).Path, $settings)
$records = [System.Collections.Generic.List[object]]::new()
$seen = @{}
$culture = [Globalization.CultureInfo]::InvariantCulture
$catalogModel = switch ($Series) {
    '4M' { 'KZS-4M (3p\+N|3p|2p)' }
    '1M-UNI' { 'KZS-1M-UNI 1p\+N' }
    default { "KZS-$Series" }
}
$ratingPattern = '(AC|A|B) ([BC])(\d+)/(0[.,]\d+)'

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
        if ($name -cnotmatch "^RCBO, $catalogModel $ratingPattern$") { continue }
        $offset = if ($Series -eq '4M') { 1 } else { 0 }
        $topology = if ($Series -eq '4M') { $Matches[1] } elseif ($Series -in '2M','1M-UNI') { '1p+N' } else { '2p' }
        $residualType = $Matches[$offset + 1]
        $curve = $Matches[$offset + 2]
        $current = [int]$Matches[$offset + 3]
        $trip = [decimal]::Parse($Matches[$offset + 4].Replace(',', '.'), $culture)
        $protected = [int][string]$topology[0]
        $neutral = $topology.EndsWith('+N')
        if ($Series -eq '4M' -and (($topology -eq '2p') -ne ($residualType -eq 'B'))) { continue }
        if (($Series -eq '2M2p' -and $residualType -ne 'A') -or ($Series -in '2M','1M-UNI' -and $residualType -eq 'B')) { continue }
        $description = $details.Element($ns + 'DESCRIPTION_LONG').Value
        $poleDescription = [regex]::Escape($topology.Replace('p', ''))
        if ($description -notmatch 'Short circuit capacity \(kA\) (\d+)/\1(?:,|$)') { continue }
        $capacity = [int]$Matches[1]
        $expectedCapacity = if ($Series -eq '1M-UNI' -or ($Series -eq '4M' -and $neutral)) { 6 } else { 10 }
        if ($capacity -ne $expectedCapacity -or
            $description -notmatch "Number of poles $poleDescription," -or
            $description -cnotmatch "Residual current type $residualType," -or
            $description -notmatch "Rated current \(A\) $current/$current,") { continue }
        $values = @{}
        foreach ($feature in $features.Elements($ns + 'FEATURE')) {
            $values[$feature.Element($ns + 'FNAME').Value] = $feature.Element($ns + 'FVALUE').Value
        }
        $voltage = [int]$values['EF000228']
        $validVoltages = if ($protected -le 2) { 230,240 } else { 400,415 }
        if ($voltage -notin $validVoltages -or $values['EF002560'] -cnotin $residualType,'Other' -or
            $values['EF000889'] -cne $curve -or $values['EF012628'] -ne [string]$capacity -or
            $values['EF000227'] -ne [string]$current -or
            ($values.ContainsKey('EF005548') -and $values['EF005548'] -ne [string]$protected) -or
            ($values.ContainsKey('EF008618') -and [int]$values['EF008618'] -ne ($protected + [int]$neutral)) -or
            $values['EF002358'] -notmatch '^0[.,]\d+$' -or
            [decimal]::Parse($values['EF002358'].Replace(',', '.'), $culture) -ne $trip) { continue }
        if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
        $seen[$code] = $true
        $record = @($code, $topology, $residualType, $curve, $current, [int]($trip * 1000), $voltage, $capacity)
        if ($Series -ne '4M') { $record += $Series }
        $records.Add($record)
    }
} finally {
    $reader.Dispose()
}

ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 4
