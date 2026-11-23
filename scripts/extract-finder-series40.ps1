param([Parameter(Mandatory)][string]$Archive, [ValidateSet('40', '46')][string]$Series = '40')

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
    # Restrict each series to monostable changeover types with a verified terminal diagram.
    $orderKey = if ($Series -eq '40') { '^40(31|51|52|61|62)([789])([0-9]{3})([0145])00([013])$' }
                else { '^46(61|52)([89])([0-9]{3})([045])0(20|40|54|74)$' }
    if ($id -cnotmatch $orderKey) { continue }
    $type = $Matches[1]
    $doublePole = $type -in '52', '62'
    $coilCode = $Matches[2]
    $voltage = [int]$Matches[3]
    $materialCode = $Matches[4]
    $version = $Matches[5]
    if ($Series -eq '40' -and (($type -eq '61' -and $materialCode -notin '1', '4') -or
        ($type -ne '61' -and $materialCode -eq '1'))) { continue }
    if (($version -in '3', '74' -and $coilCode -ne '9') -or ($version -eq '54' -and $coilCode -ne '8')) { continue }
    $details = $product.PRODUCT_DETAILS
    $features = $product.PRODUCT_FEATURES
    $description = [string]$details.DESCRIPTION_LONG
    $mode = if ($coilCode -eq '8') { 'AC' } else { 'DC' }
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
    $material = @{ '0' = 'AgNi'; '1' = 'AgNi'; '4' = 'AgSnO2'; '5' = 'AgNi+Au' }[$materialCode]
    $verifiedMaterial = [regex]::Match($description, 'Contact Material: ([^ ]+)')
    if (!$verifiedMaterial.Success -or $verifiedMaterial.Groups[1].Value.Replace('₂', '2') -cne $material) { continue }
    if ($details.MANUFACTURER_PID -cne $id -or $details.MANUFACTURER_NAME -cne 'Finder Spa' -or
        $features.REFERENCE_FEATURE_GROUP_ID -cne 'EC001437' -or $voltage -le 0 -or
        $description -notmatch 'Contacts configuration: CO' -or $description -notmatch 'Mono stable' -or
        $description -notmatch 'Polarity free' -or $description -notmatch "Coil version: $mode(?:\s|$)" -or
        $description -notmatch "Volt ${mode}: $voltage V" -or
        ($Series -eq '40' -and $description -notmatch 'Complete with socket: no')) { continue }
    $values = @{}
    foreach ($feature in $features.FEATURE) { $values[[string]$feature.FNAME] = @($feature.FVALUE) }
    $poles = if ($doublePole) { '2' } else { '1' }
    if ([string]$values['EF008255'][0] -cne '0' -or [string]$values['EF008256'][0] -cne '0' -or
        [string]$values['EF008257'][0] -cne $poles) { continue }
    $measurements = @()
    foreach ($key in 'EF000001', 'EF000008', 'EF000040', 'EF000049') {
        if ($values[$key].Count -ne 1 -or [string]$values[$key][0] -notmatch '^\d+(\.\d+)?$') { break }
        $measurements += [double]::Parse($values[$key][0], [Globalization.CultureInfo]::InvariantCulture)
    }
    if ($measurements.Count -ne 4 -or @($measurements | Where-Object { $_ -le 0 }).Count) { continue }
    if ($type -eq '62' -and ($measurements[0] -ne 10 -or $measurements[1] -ne 12.4 -or
        $measurements[2] -ne 25 -or $measurements[3] -ne 29)) { continue }
    if ($Series -eq '40' -and $type -eq '61' -and ($measurements[0] -ne 16 -or $measurements[1] -ne 12.4 -or
        $measurements[2] -ne 25 -or $measurements[3] -ne 29)) { continue }
    $ratedCurrent = if ($doublePole) { 8 } else { 16 }
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
