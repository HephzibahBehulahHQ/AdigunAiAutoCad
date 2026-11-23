param([Parameter(Mandatory)][string]$Catalog, [ValidateSet('aR','gR-gS')][string]$Utilization = 'aR')

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
        if ($Utilization -eq 'gR-gS') {
            if ($name -cnotmatch '^Fuse link, (NH(?:000|00|0|1C|[123]|4a?|1XL|2XL|3L)(?:/K)?|NHG[123]|NHS(?:000/80|[123]/110(?:/M)?))(?: (UQ2))? (gR|gS) (\d+(?:[.,]\d+)?)A/(500|690|750|800|1000|1100)V( DC)?$') { continue }
            $format = $Matches[1]
            $series = [string]$Matches[2]
            $category = $Matches[3]
            $current = [decimal]::Parse($Matches[4].Replace(',', '.'), $culture)
            $voltage = [int]$Matches[5]
            $dc = [bool]$Matches[6]
            $size = $format -replace '^NH[GS]', 'NH' -replace '/.*$', ''
            $page = if ($category -eq 'gS' -and !$dc -and !$series) {
                if ($voltage -eq 800 -and $format -cmatch '^NH(00|[123])$') { 75 }
                elseif ($voltage -eq 690) {
                    if ($format -cmatch '^NH0{2,3}$') { 48 }
                    elseif ($format -cmatch '^NH[123]$') { 49 }
                    elseif ($format -cmatch '^NHS[123]/110(?:/M)?$') { 50 }
                }
            } elseif ($category -eq 'gR' -and $series -eq 'UQ2' -and !$dc) {
                if ($voltage -eq 690) {
                    if ($format -cmatch '^NH000(?:/K)?$') { 40 }
                    elseif ($format -cmatch '^NH[123](?:/K)?$') { 41 }
                    elseif ($format -eq 'NHS000/80') { 45 }
                    elseif ($format -cmatch '^NHS[123]/110$') { 46 }
                } elseif ($voltage -eq 500) {
                    if ($format -cmatch '^NH4a?$') { 42 }
                    elseif ($format -cmatch '^NHG[123]$') { 47 }
                }
            } elseif ($category -eq 'gR' -and $dc -and !$series) {
                if ($voltage -in 750,1000 -and $format -in 'NH0','NH1C') { 43 }
                elseif ($voltage -eq 1100 -and $format -cmatch '^NH(?:1XL|2XL|3L)(?:/K)?$') { 44 }
            }
            if (!$page) { continue }
            $description = $details.Element($ns + 'DESCRIPTION_LONG').Value
            $voltageType = if ($dc) { 'DC' } else { 'AC' }
            if ($description -cnotmatch "Breaking capacity $voltageType \(kA\) (\d+)(?:,|$)") { continue }
            $capacity = [int]$Matches[1]
            $expectedCapacity = switch ($page) {
                43 { @(20) }; 44 { @(10) }; 48 { @(100) }; 49 { @(100,120) }; 50 { @(100) }
                75 { if ($size -eq 'NH00') { @(30) } else { @(120) } }
                default { @(200) }
            }
            if ($capacity -notin $expectedCapacity -or $description -notmatch "Size $size," -or
                $description -cnotmatch "Time-Current Characteristic $category" -or
                $description -notmatch "Rated $voltageType voltage(?: \(V\))? $voltage/$voltage(?:,|$)") { continue }
            $values = @{}
            foreach ($feature in $features.Elements($ns + 'FEATURE')) {
                $values[$feature.Element($ns + 'FNAME').Value] = $feature.Element($ns + 'FVALUE').Value
            }
            $voltageKey, $capacityKey = if ($dc) { 'EF012281','EF017699' } else { 'EF007682','EF017698' }
            $reportedSize = if ($page -eq 44) { $size.Substring(2) } else { $size }
            if (($dc -and $values['EF000187'] -cne 'DC') -or (!$dc -and $values['EF000187'] -cnotin 'AC','AC/DC') -or
                $values['EF015865'] -cne $reportedSize -or $values[$voltageKey] -ne [string]$voltage -or
                $values[$capacityKey] -ne [string]$capacity -or $values['EF000227'] -notmatch '^\d+(?:[.,]\d+)?$' -or
                [decimal]::Parse($values['EF000227'].Replace(',', '.'), $culture) -ne $current -or
                ($category -eq 'gR' -and $values['EF002572'] -cnotmatch '^gR\s')) { continue }
            $indicator = if ($format.EndsWith('/M')) { 'centre' } elseif ($format.EndsWith('/K')) { 'striker' }
                elseif ($description -notmatch 'Indicator Combination fuse status indicator') { 'top' } else { 'combined' }
            $timeConstant = if ($dc) { if ($page -eq 43) { 2 } else { 5 } } else { $null }
            if ($dc -and $description -notmatch "L/R \(ms\) $timeConstant(?:,|$)") { continue }
            if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
            $seen[$code] = $true
            $records.Add(@($code, $format, $series, $current, $voltage, [int]$page, $category, $capacity, $timeConstant, $indicator))
            continue
        }
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

