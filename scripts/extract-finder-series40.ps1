param([Parameter(Mandatory)][string]$Archive, [ValidateSet('40', '46', '55')][string]$Series = '40')

$ErrorActionPreference = 'Stop'
$zip = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Archive).Path)
try {
    $entry = $zip.GetEntry('FINBMECAT_ENG_20260824_3996421788343213.xml')
    if (!$entry) { throw 'Expected the Finder English BMEcat release dated 2026-08-24.' }
    $reader = [IO.StreamReader]::new($entry.Open())
    try { [xml]$catalog = $reader.ReadToEnd() }
    finally { $reader.Dispose() }
}
finally { $zip.Dispose() }

$seen = @{}
$records = [System.Collections.Generic.List[object]]::new()
foreach ($product in $catalog.SelectNodes('//*[local-name()="PRODUCT"]')) {
    $id = [string]$product.SUPPLIER_PID
    # Restrict each series to changeover types with a verified terminal diagram.
    $orderKey = if ($Series -eq '40') { '^40(31|51|52|61|62)([6789])([0-9]{3})([0145])0[02]([013])$' }
                elseif ($Series -eq '55') { '^55([13][234])([89])([0-9]{3})([05])0([0-9]{2})$' }
                else { '^46(61|52)([89])([0-9]{3})([045])0(20|40|54|74)$' }
    if ($id -cnotmatch $orderKey) { continue }
    $type = $Matches[1]
    $doublePole = $type -in '52', '62'
    $coilCode = $Matches[2]
    $voltage = [int]$Matches[3]
    $materialCode = $Matches[4]
    $version = $Matches[5]
    $shortPins = $Series -eq '40' -and $id[10] -eq '2'
    $bistable = $coilCode -eq '6'
    if ($bistable -and ($type -notin '31', '51', '52', '61' -or $shortPins -or $version -ne '0' -or
        $voltage -notin 5, 6, 12, 24, 48, 110 -or ($type -ne '61' -and $materialCode -ne '0'))) { continue }
    if ($shortPins) {
        if ($type -notin '31', '51', '61' -or $coilCode -notin '7', '9' -or $version -notin '0', '1' -or
            $materialCode -notin '1', '4' -or ($type -ne '61' -and $materialCode -ne '1')) { continue }
    } elseif ($Series -eq '40' -and (($type -eq '61' -and $materialCode -notin '1', '4') -or
        ($type -ne '61' -and $materialCode -eq '1'))) { continue }
    if ($Series -ne '55' -and (($version -in '3', '74' -and $coilCode -ne '9') -or ($version -eq '54' -and $coilCode -ne '8'))) { continue }
    $details = $product.PRODUCT_DETAILS
    $features = $product.PRODUCT_FEATURES
    $description = [string]$details.DESCRIPTION_LONG
    $socketOptional = $description -match 'Complete with socket: no' -or
        ($type -eq '51' -and $description -match '^PCB/Plug-in relays' -and
         $description -match 'Accessories: Socket S\.95' -and $description -notmatch 'Complete with socket: yes')
    if ($shortPins -and $description -notmatch 'Type of electric connection: PCB connection') { continue }
    $mode = if ($bistable) { 'AC/DC' } elseif ($coilCode -eq '8') { 'AC' } else { 'DC' }
    $operation = if ($bistable) { 'Polarized\s+Bistable' } else { 'Polarity free\s+Mono stable' }
    $voltagesAgree = if ($bistable) { $description -match "Volt AC: $voltage V" -and $description -match "Volt DC: $voltage V" }
                     else { $description -match "Volt ${mode}: $voltage V" }
    if ($Series -eq '40' -and $type -eq '62') {
        $coilVoltages = if ($mode -eq 'AC') { 110, 120, 230, 240 } else { 5, 6, 7, 9, 12, 14, 18, 21, 24, 28, 48, 60, 110, 125 }
        if ($materialCode -eq '5' -or $version -eq '3' -or $voltage -notin $coilVoltages) { continue }
    }
    if ($Series -eq '46') {
        $coilVoltages = if ($mode -eq 'AC') { 12, 24, 48, 110, 120, 230, 240 } else { 12, 24, 48, 110, 125 }
        $connection = if ($doublePole) { 'Plug-in connection\s{2,}' } else { 'Plug-in connection Faston 187' }
        if ($voltage -notin $coilVoltages -or $description -notmatch "Type of electric connection: $connection" -or
            ($doublePole -and $materialCode -eq '4')) { continue }
    }
    if ($Series -eq '55') {
        $coilVoltages = if ($mode -eq 'AC') { 6,12,24,48,60,110,120,230,240 } else { 6,12,24,48,60,110,125,220 }
        $options = if ($type.StartsWith('1')) { '00','01' }
                   elseif ($type -eq '33' -and $mode -eq 'AC') { '00','10','30','50' }
                   elseif ($type -eq '33') { '00','10','60','70','80','90' }
                   elseif ($mode -eq 'AC') { '00','20','30','40','50','54' }
                   else { '00','20','40','60','70','74','80','90','94' }
        if ($voltage -notin $coilVoltages -or $version -notin $options -or
            ($voltage -eq 220 -and $version -in '60','70','74','80','90','94')) { continue }
        if ($version -in '80','90','94') { $operation = 'Polarized\s+Mono stable' }
        $connection = if ($type.StartsWith('1')) { 'PCB connection' } else { 'Plug-in connection' }
        if ($description -notmatch "Type of electric connection: $connection" -or !$socketOptional) { continue }
    }
    $material = @{ '0' = 'AgNi'; '1' = 'AgNi'; '4' = 'AgSnO2'; '5' = 'AgNi+Au' }[$materialCode]
    $verifiedMaterial = [regex]::Match($description, 'Contact Material: ([^ ]+)')
    if (!$verifiedMaterial.Success -or $verifiedMaterial.Groups[1].Value.Replace('₂', '2') -cne $material) { continue }
    if ($details.MANUFACTURER_PID -cne $id -or $details.MANUFACTURER_NAME -cne 'Finder Spa' -or
        $features.REFERENCE_FEATURE_GROUP_ID -cne 'EC001437' -or $voltage -le 0 -or
        $description -notmatch 'Contacts configuration: CO' -or $description -notmatch $operation -or
        $description -notmatch "Coil version: $mode(?:\s|$)" -or !$voltagesAgree -or
        ($Series -eq '40' -and !$socketOptional)) { continue }
    $values = @{}
    foreach ($feature in $features.FEATURE) { $values[[string]$feature.FNAME] = @($feature.FVALUE) }
    $poles = if ($Series -eq '55') { $type.Substring(1) } elseif ($doublePole) { '2' } else { '1' }
    if ([string]$values['EF008255'][0] -cne '0' -or [string]$values['EF008256'][0] -cne '0' -or
        [string]$values['EF008257'][0] -cne $poles) { continue }
    $measurements = @()
    foreach ($key in 'EF000001', 'EF000008', 'EF000040', 'EF000049') {
        if ($values[$key].Count -ne 1 -or [string]$values[$key][0] -notmatch '^\d+(\.\d+)?$') { break }
        $measurements += [double]::Parse($values[$key][0], [Globalization.CultureInfo]::InvariantCulture)
    }
    if ($measurements.Count -ne 4 -or @($measurements | Where-Object { $_ -le 0 }).Count) { continue }
    if ($type -eq '51' -and ($measurements[0] -notin 10,12 -or $measurements[1] -ne 12.4 -or
        $measurements[2] -ne 25 -or $measurements[3] -ne 29)) { continue }
    if ($shortPins -and $type -ne '61' -and $measurements[0] -ne 12) { continue }
    if ($type -eq '62' -and ($measurements[0] -ne 10 -or $measurements[1] -ne 12.4 -or
        $measurements[2] -ne 25 -or $measurements[3] -ne 29)) { continue }
    if ($Series -eq '40' -and $type -eq '61' -and ($measurements[0] -ne 16 -or $measurements[1] -ne 12.4 -or
        $measurements[2] -ne 25 -or $measurements[3] -ne 29)) { continue }
    $ratedCurrent = if ($doublePole) { 8 } else { 16 }
    if ($Series -eq '55') {
        $ratedCurrent = if ($poles -eq '4') { 7 } else { 10 }
        $height = if ($type.StartsWith('1')) { 35.8 } else { 37.2 }
        if ($measurements[0] -ne $ratedCurrent -or $measurements[1] -ne 20.7 -or
            $measurements[2] -ne $height -or $measurements[3] -ne 27.7) { continue }
    }
    if ($Series -eq '46' -and ($measurements[0] -ne $ratedCurrent -or $measurements[1] -ne 12.4 -or
        $measurements[2] -ne 32.8 -or $measurements[3] -ne 29)) { continue }
    $productLink = $product.SelectNodes('.//*[local-name()="UDX.EDXF.MIME_SOURCE"]') |
        Where-Object { $_.InnerText -ceq "https://www.findernet.com/en/p/$id" } | Select-Object -First 1
    if (!$productLink) { continue }
    if ($seen.ContainsKey($id)) { throw "Duplicate supplier order code $id" }
    $seen[$id] = $true
    $records.Add(@($id, $voltage, $mode, $material, [int]$version) + $measurements)
}
ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 4
