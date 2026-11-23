param([Parameter(Mandatory)][string]$Archive)

$ErrorActionPreference = 'Stop'
$zip = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Archive).Path)
try {
    $entry = $zip.GetEntry('FINBMECAT_ENG_20260824_3996421788343213.xml')
    if (!$entry) { throw 'Expected the Finder English BMEcat release dated 2026-08-24.' }
    $reader = [IO.StreamReader]::new($entry.Open())
    try { [xml]$catalog = $reader.ReadToEnd() }
    finally { $reader.Dispose() }
} finally { $zip.Dispose() }

$contacts = @{ '3' = 0; '4' = -1; '5' = 1; '6' = 2; '7' = 1 }
$profiles = @{
    '32' = @{ Materials = '14'; Circuits = '345'; Options = '24'; Voltages = @(12,24,48,60,120,230) }
    '34' = @{ Materials = '14'; Circuits = '367'; Options = '24'; Voltages = @(12,24,48,60,120,230) }
    '44' = @{ Materials = '4'; Circuits = '367'; Options = '1'; Voltages = @(12,24,120,230) }
    '64' = @{ Materials = '4'; Circuits = '3467'; Options = '1'; Voltages = @(12,24,120,230) }
    '72' = @{ Materials = '1'; Circuits = '345'; Options = '1'; Voltages = @(24,48,110,230) }
    '74' = @{ Materials = '1'; Circuits = '3467'; Options = '1'; Voltages = @(24,48,110,230) }
}
$seen = @{}
$records = [System.Collections.Generic.List[object]]::new()
foreach ($product in $catalog.SelectNodes('//*[local-name()="PRODUCT"]')) {
    $id = [string]$product.SUPPLIER_PID
    if ($id -cnotmatch '^22(32|34|44|64|72|74)0(\d{3})([14])([3-7])([124])([07])$') { continue }
    $type = $Matches[1]
    $voltage = [int]$Matches[2]
    $material = $Matches[3]
    $circuit = $Matches[4]
    $option = $Matches[5]
    $mirror = $Matches[6] -eq '7'
    $profile = $profiles[$type]
    if (!$profile.Materials.Contains($material) -or !$profile.Circuits.Contains($circuit) -or
        !$profile.Options.Contains($option) -or $voltage -notin $profile.Voltages -or
        ($mirror -and ($type -notin '44','64','74' -or $circuit -ne '7'))) { continue }
    $details = $product.PRODUCT_DETAILS
    if ([string]$details.MANUFACTURER_PID -cne $id -or [string]$details.MANUFACTURER_NAME -cne 'Finder Spa' -or
        [string]$details.DESCRIPTION_SHORT -cne 'MODULAR CONTACTOR' -or
        [string]$product.PRODUCT_FEATURES.REFERENCE_FEATURE_GROUP_ID -cne 'EC001653') { continue }
    $values = @{}
    foreach ($feature in $product.PRODUCT_FEATURES.FEATURE) {
        $values[[string]$feature.FNAME] = [string]$feature.FVALUE
    }
    $poles = [int][string]$type[1]
    $closedCount = if ($circuit -eq '4') { $poles } else { $contacts[$circuit] }
    $openCount = $poles - $closedCount
    if ($values['EF008256'] -ne [string]$openCount -or $values['EF008255'] -ne [string]$closedCount -or
        $values['EF005293'] -ne 'EV000509') { continue }
    $contactMaterial = if ($material -eq '1') { 'AgNi' } else { 'AgSnO2' }
    if ([string]$details.DESCRIPTION_LONG -cnotmatch "Contact Material: $contactMaterial\s") { continue }
    if ($seen.ContainsKey($id)) { throw "Duplicate Finder order code $id" }
    $seen[$id] = $true
    $records.Add(@($id, $type, $voltage, $material, $circuit, $option, $mirror))
}
ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 3
