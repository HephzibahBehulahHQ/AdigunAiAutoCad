param([Parameter(Mandatory)][string]$Catalog, [ValidateSet('CH', 'NH')][string]$Family = 'CH')

$ErrorActionPreference = 'Stop'
$settings = [Xml.XmlReaderSettings]::new()
$settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
$reader = [Xml.XmlReader]::Create((Resolve-Path -LiteralPath $Catalog).Path, $settings)
$records = [System.Collections.Generic.List[object]]::new()
$seen = @{}
$culture = [Globalization.CultureInfo]::InvariantCulture
$knifeBlade = $Family -eq 'NH'
$codePattern = if ($knifeBlade) { '^\d{9}$' } else { '^00265[12]\d{3}$' }
$featureGroup = if ($knifeBlade) { 'EC000055' } else { 'EC002704' }
$designation = if ($knifeBlade) { '(NH(?:000|00C|00|0|1C|1|2C|2|3C|3|4a)(?:/I)?) (gG|aM)' } else { 'CH(8x32|10x38|14x51|22x58) (gG|aM)' }

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
        if ($code -cnotmatch $codePattern -or
            $details.Element($ns + 'MANUFACTURER_PID').Value -cne $code -or
            $details.Element($ns + 'MANUFACTURER_NAME').Value -cne 'ETI' -or
            $features.Element($ns + 'REFERENCE_FEATURE_GROUP_ID').Value -cne $featureGroup) { continue }
        $name = $details.Element($ns + 'DESCRIPTION_SHORT').Value
        if ($name -cnotmatch "^Fuse link, $designation (\d+(?:[.,]\d+)?)A/(\d+)V$") { continue }
        $format = $Matches[1]
        $size = $format -replace '/I$', ''
        $insulated = $format.EndsWith('/I')
        $category = $Matches[2]
        $current = [double]::Parse($Matches[3].Replace(',', '.'), $culture)
        $voltage = [int]$Matches[4]
        $physicalSize = if ($size -eq '8x32') { '8x3[12]' } else { $size }
        $description = $details.Element($ns + 'DESCRIPTION_LONG').Value
        if ($description -notmatch "Size $physicalSize," -or
            $description -cnotmatch "(?:Time-Current Characteristic|Characteristics) $category(?:,|$)") { continue }
        if ($description -notmatch 'Breaking capacity AC \(kA\) (\d+),') { continue }
        $capacity = [int]$Matches[1]
        $values = @{}
        foreach ($feature in $features.Elements($ns + 'FEATURE')) {
            $values[$feature.Element($ns + 'FNAME').Value] = $feature.Element($ns + 'FVALUE').Value
        }
        if ($knifeBlade) {
            if (($insulated -and ($size -notin 'NH000','NH00','NH1C','NH1','NH2C','NH2','NH3' -or $values['EF012538'] -cne 'true')) -or
                ($category -eq 'aM' -and ($size -ne 'NH000' -or $insulated))) { continue }
            if ($voltage -notin 400,500,690 -or $capacity -notin 50,100,120 -or
                $values['EF000187'] -notin 'AC','AC/DC' -or
                $values['EF015865'] -cne $size -or $values['EF017698'] -ne [string]$capacity -or
                $values['EF007682'] -ne [string]$voltage -or
                $values['EF002572'] -cnotmatch "^$category(?:\s|$)") { continue }
        } else {
            $expectedCapacity = if ($size -eq '8x32') { 20 } else { 120 }
            if ($capacity -ne $expectedCapacity -or $values['EF000187'] -cne 'AC' -or $values['EF005617'] -ne [string]$capacity -or
                $values['EF000228'] -ne [string]$voltage) { continue }
        }
        if ($values['EF000227'] -notmatch '^\d+(?:[.,]\d+)?$' -or
            [double]::Parse($values['EF000227'].Replace(',', '.'), $culture) -ne $current) { continue }
        if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
        $seen[$code] = $true
        $records.Add(@($code, $format, $category, $current, $voltage, $capacity))
    }
} finally {
    $reader.Dispose()
}

ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 4
