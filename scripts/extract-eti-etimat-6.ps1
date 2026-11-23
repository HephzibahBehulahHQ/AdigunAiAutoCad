param([Parameter(Mandatory)][string]$Catalog, [ValidateSet('6', '10', '10-125', 'P6', 'P10', 'P10-DC', 'P10-QC')][string]$Series = '6')

$ErrorActionPreference = 'Stop'
$settings = [Xml.XmlReaderSettings]::new()
$settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
$reader = [Xml.XmlReader]::Create((Resolve-Path -LiteralPath $Catalog).Path, $settings)
$seen = @{}
$records = [System.Collections.Generic.List[object]]::new()
$highCurrent = $Series -eq '10-125'
$dc = $Series -eq 'P10-DC'
$quickConnect = $Series -eq 'P10-QC'
$catalogSeries = if ($highCurrent) { '10' } else { $Series }
$topologies = if ($dc) { '[12]p' } elseif ($quickConnect) { '3p\+N' } elseif ($highCurrent) { '3p\+N|[1234]p' } else { '1p\+N|3p\+N|[123]p' }

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
        $curves = if ($dc) { 'BCKZ' } elseif ($quickConnect) { 'BCDK' } elseif ($Series -eq 'P10') { 'BCDKZ' } else { 'BCD' }
        if ($short -cnotmatch "^(?:Miniature circuit breaker, )?ETIMAT $catalogSeries ($topologies) ([$curves])\s*(\d+(?:[.,]\d+)?)$") { continue }
        $topology = $Matches[1]
        $curve = $Matches[2]
        $current = [double]::Parse($Matches[3].Replace(',', '.'), [Globalization.CultureInfo]::InvariantCulture)
        $protected = [int][string]$topology[0]
        $neutral = $topology.EndsWith('+N')
        $poles = $protected + [int]$neutral
        $long = $details.Element($ns + 'DESCRIPTION_LONG').Value
        $values = @{}
        foreach ($feature in $features.Elements($ns + 'FEATURE')) {
            $values[$feature.Element($ns + 'FNAME').Value] = $feature.Element($ns + 'FVALUE').Value
        }
        $width = @{ 1 = 17.6; 2 = 35.4; 3 = 53.4; 4 = 71 }[$poles]
        $voltage = if ($topology -eq '1p') { '230/400' } elseif ($topology -eq '1p+N') { '230' } else { '400' }
        $capacity = if ($Series -eq 'P10' -or ($Series -eq '10' -and $current -le 40)) { 10 } else { 6 }
        if ($quickConnect) {
            if ($current -gt 20 -or ($curve -eq 'B' -and $current -lt 6) -or
                $long -notmatch 'Number of poles 3\+N, Rated voltage \(V\) (400|415),' ) { continue }
            $voltage = $Matches[1]
            if ($long -notmatch 'Short circuit capacity \(kA\) 10,' -or $long -notmatch 'Voltage type AC$') { continue }
            $width = 72
        } elseif ($dc) {
            $voltage = if ($poles -eq 1) { '220' } else { '440' }
            if (($curve -in 'K','Z' -and $current -gt 32) -or
                $long -notmatch "Number of poles $poles, Rated voltage \(V\) $voltage," -or
                $long -notmatch 'Short circuit capacity \(kA\) 10,' -or
                $long -notmatch 'Standards 60898-2,' -or
                $long -notmatch 'Voltage type DC$') { continue }
            $width = [Math]::Round(17.8 * $poles, 1)
        } elseif ($highCurrent) {
            if ($current -notin 80,100,125 -or ($curve -eq 'D' -and ($current -eq 125 -or $topology -eq '4p'))) { continue }
            $capacity = if ($current -eq 125 -or ($curve -eq 'D' -and $current -eq 100)) { 15 } else { 20 }
            $poleDescription = [regex]::Escape($topology.Replace('p', ''))
            if ($long -notmatch "Number of poles $poleDescription," -or
                $long -notmatch "Short circuit capacity \(kA\) $capacity(?:\s|,|$)" -or
                ($values['EF009557'] -ne [string]$capacity -and $values['EF009558'] -ne [string]$capacity) -or
                $long -notmatch 'Voltage type AC(?:\s|,|$)' -or
                $long -notmatch 'Rated voltage \(V\) (240/415|230/400|240|415|230|400)(?:\s|,|$)') { continue }
            $voltage = $Matches[1]
            $width = 27 * $poles
        } elseif ($Series -eq '6') {
            if ($long -notmatch 'Short circuit capacity \(kA\) 6(?:/6)?(?:\s|,|$)') { continue }
        } else {
            $voltage = [string]$values['EF000228']
            if ($voltage -notin '230','240','400','415' -or
                ($values['EF009555'] -ne [string]$capacity -and $values['EF009556'] -ne [string]$capacity) -or
                [int]$values['EF002950'] -ne $poles) { continue }
            if ($Series -eq '10') {
                if (($current -gt 40 -and $current -lt 50) -or
                    $long -notmatch "Short circuit capacity \(kA\) $capacity(?:\s|,|$)" -or
                    $long -notmatch 'Rated voltage \(V\) (230/400|230|400)(?:\s|,|$)') { continue }
                $voltage = $Matches[1]
            }
            $moduleWidth = if ($Series -eq '10') { 17.6 } else { 17.8 }
            $width = [Math]::Round($moduleWidth * $poles, 1)
        }
        $voltageType = if ($dc) { 'DC' } else { 'AC' }
        if ($values['EF000889'] -cne $curve -or (-not $highCurrent -and $values['EF000187'] -cne $voltageType) -or
            $values['EF000227'] -notmatch '^\d+(?:[.,]\d+)?$' -or
            [double]::Parse($values['EF000227'].Replace(',', '.'), [Globalization.CultureInfo]::InvariantCulture) -ne $current -or
            ((-not $highCurrent -or $values.ContainsKey('EF005548')) -and [int]$values['EF005548'] -ne $protected) -or
            [int]$values['EF008618'] -ne $poles -or
            (-not $highCurrent -and ($current -lt 0.5 -or $current -gt 63))) { continue }
        if ($seen.ContainsKey($id)) { throw "Duplicate ETI order code $id" }
        $seen[$id] = $true
        $record = @($id, $topology, $curve, $current, $voltage, $width)
        if ($Series -ne '6') { $record += $catalogSeries }
        if ($highCurrent) { $record += $capacity }
        $records.Add($record)
    }
} finally {
    $reader.Dispose()
}

ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 4
