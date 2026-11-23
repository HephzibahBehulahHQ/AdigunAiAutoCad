param([Parameter(Mandatory)][string]$Archive)

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
    # The manufacturer order key limits this map to monostable one-pole CO relays with 5.2 mm pins.
    if ($id -cnotmatch '^40(31|51)([789])([0-9]{3})([045])00([013])$') { continue }
    $coilCode = $Matches[2]
    $voltage = [int]$Matches[3]
    $materialCode = $Matches[4]
    $version = $Matches[5]
    if ($version -eq '3' -and $coilCode -ne '9') { continue }
    $details = $product.PRODUCT_DETAILS
    $features = $product.PRODUCT_FEATURES
    $description = [string]$details.DESCRIPTION_LONG
    $mode = if ($coilCode -eq '8') { 'AC' } else { 'DC' }
    $material = @{ '0' = 'AgNi'; '4' = 'AgSnO2'; '5' = 'AgNi+Au' }[$materialCode]
    $verifiedMaterial = [regex]::Match($description, 'Contact Material: ([^ ]+)')
    if (!$verifiedMaterial.Success -or $verifiedMaterial.Groups[1].Value.Replace('₂', '2') -cne $material) { continue }
    if ($details.MANUFACTURER_PID -cne $id -or $details.MANUFACTURER_NAME -cne 'Finder Spa' -or
        $features.REFERENCE_FEATURE_GROUP_ID -cne 'EC001437' -or $voltage -le 0 -or
        $description -notmatch 'Contacts configuration: CO' -or $description -notmatch 'Mono stable' -or
        $description -notmatch 'Polarity free' -or $description -notmatch "Coil version: $mode(?:\s|$)" -or
        $description -notmatch "Volt ${mode}: $voltage V" -or $description -notmatch 'Complete with socket: no') { continue }
    $values = @{}
    foreach ($feature in $features.FEATURE) { $values[[string]$feature.FNAME] = @($feature.FVALUE) }
    if ([string]$values['EF008255'][0] -cne '0' -or [string]$values['EF008256'][0] -cne '0' -or
        [string]$values['EF008257'][0] -cne '1') { continue }
    $measurements = @()
    foreach ($key in 'EF000001', 'EF000008', 'EF000040', 'EF000049') {
        if ($values[$key].Count -ne 1 -or [string]$values[$key][0] -notmatch '^\d+(\.\d+)?$') { break }
        $measurements += [double]::Parse($values[$key][0], [Globalization.CultureInfo]::InvariantCulture)
    }
    if ($measurements.Count -ne 4 -or @($measurements | Where-Object { $_ -le 0 }).Count) { continue }
    $productLink = $product.SelectNodes('.//*[local-name()="UDX.EDXF.MIME_SOURCE"]') |
        Where-Object { $_.InnerText -ceq "https://www.findernet.com/en/p/$id" } | Select-Object -First 1
    if (!$productLink) { continue }
    if ($seen.ContainsKey($id)) { throw "Duplicate supplier order code $id" }
    $seen[$id] = $true
    $records.Add(@($id, $voltage, $mode, $material, [int]$version) + $measurements)
}
ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 4
