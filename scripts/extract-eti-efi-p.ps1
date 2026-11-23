param([Parameter(Mandatory)][string]$Catalog)

$ErrorActionPreference = 'Stop'
$settings = [Xml.XmlReaderSettings]::new()
$settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
$reader = [Xml.XmlReader]::Create((Resolve-Path -LiteralPath $Catalog).Path, $settings)
$culture = [Globalization.CultureInfo]::InvariantCulture
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
        $features = $product.Element($ns + 'PRODUCT_FEATURES')
        if ($code -cnotmatch '^002061\d{3}$' -or
            $details.Element($ns + 'MANUFACTURER_PID').Value -cne $code -or
            $details.Element($ns + 'MANUFACTURER_NAME').Value -cne 'ETI' -or
            $features.Element($ns + 'REFERENCE_FEATURE_GROUP_ID').Value -cne 'EC000003') { continue }
        $name = $details.Element($ns + 'DESCRIPTION_SHORT').Value
        if ($name -cnotmatch '^RCCB, (EFI(?:6)?-P([24])(R?)) (AC|A)( X)? (16|25|40|63|80)/(0[.,]\d+)( (?:NL|127V))?$') { continue }
        $series = $Matches[1]
        $poles = [int]$Matches[2]
        $reset = [bool]$Matches[3]
        $type = $Matches[4]
        $special = [string]$Matches[5]
        $current = [int]$Matches[6]
        $trip = [decimal]::Parse($Matches[7].Replace(',', '.'), $culture)
        $variant = ($special + [string]$Matches[8]).Trim()
        if (($poles -eq 4 -and $current -gt 63) -or
            ($variant -and ($reset -or $series.StartsWith('EFI6'))) -or
            ($variant -eq 'X' -and $type -ne 'A')) { continue }
        $description = $details.Element($ns + 'DESCRIPTION_LONG').Value
        if ($description -notmatch 'Rated AC voltage \(V\) (\d+)/(\d+),' ) { continue }
        $voltage = @([int]$Matches[1], [int]$Matches[2])
        $capacity = if ($series.StartsWith('EFI6')) { 6 } else { 10 }
        $poleDescription = ($poles - 1).ToString() + '\+N'
        if ($description -cnotmatch "Residual current type $type," -or
            $description -notmatch "Number of poles $poleDescription," -or
            $description -notmatch "Rated current \(A\) $current/$current," -or
            $description -notmatch 'Standards (?:IEC/EN|EN/IEC) 61008' -or
            $description -notmatch "Rated conditional short-circuit current Inc \(kA\) $capacity(?:,|$)") { continue }
        $values = @{}
        foreach ($feature in $features.Elements($ns + 'FEATURE')) {
            $values[$feature.Element($ns + 'FNAME').Value] = $feature.Element($ns + 'FVALUE').Value
        }
        $etimVoltage = [int]$values['EF000228']
        if (($variant -eq '127V' -and $etimVoltage -ne 127) -or
            ($variant -ne '127V' -and $etimVoltage -notin $voltage) -or
            $values['EF001391'] -ne [string]$poles -or
            $values['EF002560'] -cne $type -or
            $values['EF000227'] -ne [string]$current -or
            $values['EF002562'] -ne [string]$capacity -or
            $values['EF002358'] -notmatch '^0[.,]\d+$' -or
            [decimal]::Parse($values['EF002358'].Replace(',', '.'), $culture) -ne $trip -or
            $values['EF000218'] -notmatch '^\d+$') { continue }
        if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
        $seen[$code] = $true
        $records.Add(@($code, $series, $poles, $type, $current, [int]($trip * 1000), $voltage, $capacity, $variant, [int]$values['EF000218']))
    }
} finally {
    $reader.Dispose()
}
ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 5
