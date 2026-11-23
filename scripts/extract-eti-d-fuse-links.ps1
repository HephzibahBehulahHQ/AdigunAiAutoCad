param([Parameter(Mandatory)][string]$Catalog)

$ErrorActionPreference = 'Stop'
$settings = [Xml.XmlReaderSettings]::new()
$settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
$reader = [Xml.XmlReader]::Create((Resolve-Path -LiteralPath $Catalog).Path, $settings)
$records = [System.Collections.Generic.List[object]]::new()
$seen = @{}

# ETI D_ENG pages 4–5 and D0_ENG page 3: axial length, body diameter, and gauge contact by current.
$smallGauge = @{ 2=6; 4=6; 6=6; 10=8; 13=8; 16=10; 20=12; 25=14 }
$largeGauge = @{ 32=16; 35=16; 40=16; 50=18; 63=20 }
$longGauge = @{ 2=6; 4=6; 6=6; 10=8; 16=10; 20=12; 25=14; 35=16; 50=18; 63=20 }
$geometry = @{
    D01 = @(36,11,'E14',@{ 2=7.3; 4=7.3; 6=7.3; 10=8.5; 13=8.5; 16=9.7 })
    D02 = @(36,15,'E18',@{ 20=10.9; 25=12.1; 32=13.3; 35=13.3; 40=13.3; 50=14.5; 63=15.9 })
    D03 = @(43,22.5,'M30 × 2',@{ 80=21.4; 100=21.4 })
    DI = @(50,13.2,'E16',@{ 2=6; 4=6; 6=6; 10=8; 16=10; 20=12; 25=14 })
    DII = @(50,21.5,'E27',$smallGauge)
    DIII = @(50,27,'E33',$largeGauge)
    'DIII-long' = @(70,27,'E33',$longGauge)
    DIV = @(56,33,'R 1¼',$null)
    DV = @(56,46,'R 2',$null)
}

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
        if ($code -cnotmatch '^002[23]\d{5}$' -or
            $details.Element($ns + 'MANUFACTURER_PID').Value -cne $code -or
            $details.Element($ns + 'MANUFACTURER_NAME').Value -cne 'ETI' -or
            $features.Element($ns + 'REFERENCE_FEATURE_GROUP_ID').Value -notin 'EC001642','EC000099') { continue }
        $name = $details.Element($ns + 'DESCRIPTION_SHORT').Value
        if ($name -cnotmatch '^Fuse link, (D0[123]|DI{1,3}|DIV|DV) (gG|gF|DZ(?:/gF)?) (\d+)A/(\d+)V$') { continue }
        $size = $Matches[1]
        $category = $Matches[2]
        $current = [int]$Matches[3]
        $voltage = [int]$Matches[4]
        $description = $details.Element($ns + 'DESCRIPTION_LONG').Value
        $d0 = $size.StartsWith('D0')
        $shape = $size
        if ($d0) {
            if ($voltage -ne 400 -or $category -ne 'gG') { continue }
        } elseif ($voltage -ne 500) {
            if ($size -ne 'DIII' -or (($voltage -ne 690 -or $category -ne 'gG' -or $description -notmatch 'Rated DC voltage \(V\) 600,') -and
                ($voltage -notin 750,1200 -or $category -ne 'gF'))) { continue }
            if ($voltage -eq 1200 -and $current -gt 35) { continue }
            $shape = 'DIII-long'
        }
        if ($description -notmatch "Size $size," -or $description -notmatch "Rated AC voltage \(V\) $voltage," -or
            $description -notmatch "Rated current \(A\) $current," -or
            $description -notmatch 'Breaking capacity AC \(kA\) (10|50),') { continue }
        $acCapacity = [int]$Matches[1]
        $dcVoltage = $null
        $dcCapacity = $null
        if ($description -match 'Rated DC voltage \(V\) (\d+),') { $dcVoltage = [int]$Matches[1] }
        if ($description -match 'Breaking capacity DC \(kA\) (\d+),') { $dcCapacity = [int]$Matches[1] }
        $values = @{}
        foreach ($feature in $features.Elements($ns + 'FEATURE')) {
            $values[$feature.Element($ns + 'FNAME').Value] = $feature.Element($ns + 'FVALUE').Value
        }
        if ($values['EF002566'] -cne $size -or $values['EF000227'] -ne [string]$current -or
            ($values['EF000228'] -ne [string]$voltage -and (-not $dcVoltage -or $values['EF000228'] -ne [string]$dcVoltage))) { continue }
        $length, $body, $base, $gauges = $geometry[$shape]
        if ($gauges -and -not $gauges.ContainsKey($current)) { continue }
        $gauge = if ($gauges) { $gauges[$current] } else { $null }
        if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
        $seen[$code] = $true
        $records.Add(@($code, $size, $category, $current, $voltage, $acCapacity, $dcVoltage, $dcCapacity, $length, $body, $gauge, $base))
    }
} finally {
    $reader.Dispose()
}

ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 4
