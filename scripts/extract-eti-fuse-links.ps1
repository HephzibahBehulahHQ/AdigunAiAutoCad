param([Parameter(Mandatory)][string]$Catalog, [ValidateSet('CH', 'NH', 'CH-PV', 'NH-PV')][string]$Family = 'CH')

$ErrorActionPreference = 'Stop'
$settings = [Xml.XmlReaderSettings]::new()
$settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
$reader = [Xml.XmlReader]::Create((Resolve-Path -LiteralPath $Catalog).Path, $settings)
$records = [System.Collections.Generic.List[object]]::new()
$seen = @{}
$culture = [Globalization.CultureInfo]::InvariantCulture
$knifeBlade = $Family -in 'NH', 'NH-PV'
$photovoltaic = $Family -in 'CH-PV', 'NH-PV'
$codePattern = if ($knifeBlade -or $photovoltaic) { '^\d{9}$' } else { '^00265[12]\d{3}$' }
$featureGroup = if ($knifeBlade) { 'EC000055' } else { 'EC002704' }
$designation = if ($knifeBlade -and $photovoltaic) { '(NH[SU]?(?:1XL|2XL|3L)) (gPV)' }
    elseif ($knifeBlade) { '(NH(?:000|00C|00|0|1C|1|2C|2|3C|3|4a)(?:/I)?) (gG|aM)' }
    elseif ($photovoltaic) { 'CH(10x38|10x85|14x51) (gPV)' }
    else { 'CH(8x32|10x38|14x51|22x58) (gG|aM)' }
$ratingPattern = if ($photovoltaic) { '(\d+(?:[.,]\d+)?)A(?:/|\s+)(\d+)V(?:\s+DC)?(?:\s+(UL))?(?:\s+(\d+)kA)?' } else { '(\d+(?:[.,]\d+)?)A/(\d+)V' }
$voltageType = if ($photovoltaic) { 'DC' } else { 'AC' }

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
        if ($name -cnotmatch "^Fuse link, $designation $ratingPattern$") { continue }
        $format = $Matches[1]
        $size = $format -replace '/I$', ''
        $insulated = $format.EndsWith('/I')
        $category = $Matches[2]
        $current = [double]::Parse($Matches[3].Replace(',', '.'), $culture)
        $voltage = [int]$Matches[4]
        $label = $Matches[5]
        $markedCapacity = $Matches[6]
        $physicalSize = if ($size -eq '8x32') { '8x3[12]' } else { $size }
        $description = $details.Element($ns + 'DESCRIPTION_LONG').Value
        if ($photovoltaic -and $knifeBlade -and $size -cmatch '^NH([SU])(.+)$') {
            $fuseType = 'NH-' + $Matches[1]
            $physicalSize = 'NH' + $Matches[2]
            if ($description -cnotmatch "Fuse type $fuseType,") { continue }
        }
        if ($description -notmatch "Size $physicalSize," -or
            $description -cnotmatch "(?:Time-Current Characteristic|Characteristics) $category(?:,|$)") { continue }
        if ($description -notmatch "Breaking capacity $voltageType \(kA\) (\d+),") { continue }
        $capacity = [int]$Matches[1]
        if ($markedCapacity -and [int]$markedCapacity -ne $capacity) { continue }
        $values = @{}
        foreach ($feature in $features.Elements($ns + 'FEATURE')) {
            $values[$feature.Element($ns + 'FNAME').Value] = $feature.Element($ns + 'FVALUE').Value
        }
        if ($photovoltaic -and $knifeBlade) {
            if ($capacity -notin 10,30,50,70 -or $values['EF000187'] -cne 'DC' -or
                $values['EF012281'] -ne [string]$voltage -or $values['EF017699'] -ne [string]$capacity -or
                $values['EF002572'] -cnotmatch '^gPV(?:\s|$)' -or
                $description -notmatch "Rated DC voltage \(V\) $voltage(?:/$voltage)?," -or
                $description -notmatch 'Standards IEC 60269-6(?:,|$)' -or
                $description -notmatch 'L/R \(ms\) ([235])(?:,|$)') { continue }
            $timeConstant = [int]$Matches[1]
        } elseif ($photovoltaic) {
            if ($capacity -notin 10,30,50 -or $description -notmatch "Rated DC voltage \(V\) $voltage," -or
                $description -notmatch 'Standards IEC 60269-6(?:,|$)' -or
                ($values.ContainsKey('EF000228') -and $values['EF000228'] -ne [string]$voltage) -or
                $description -notmatch 'Rated current \(A\) (\d+(?:[.,]\d+)?),' -or
                [double]::Parse($Matches[1].Replace(',', '.'), $culture) -ne $current) { continue }
        } elseif ($knifeBlade) {
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
        if (($knifeBlade -or -not $photovoltaic -or $values.ContainsKey('EF000227')) -and
            ($values['EF000227'] -notmatch '^\d+(?:[.,]\d+)?$' -or
             [double]::Parse($values['EF000227'].Replace(',', '.'), $culture) -ne $current)) { continue }
        if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
        $seen[$code] = $true
        $record = @($code, $format, $category, $current, $voltage, $capacity)
        if ($photovoltaic -and $knifeBlade) { $record += @($label, $timeConstant) }
        elseif ($photovoltaic -and $label -eq 'UL') { $record += $label }
        $records.Add($record)
    }
} finally {
    $reader.Dispose()
}

ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 4
