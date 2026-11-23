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

$acVoltages = 8,12,24,48,110,120,230,240
$dcVoltages = 12,24,48,110
$records = [System.Collections.Generic.List[object]]::new()
$seen = @{}
foreach ($product in $catalog.SelectNodes('//*[local-name()="PRODUCT"]')) {
    $code = [string]$product.SUPPLIER_PID
    if ($code -cnotmatch '^20(21|22|23|24|26|27|28)([89])(\d{3})([04])000$') { continue }
    $type = $Matches[1]
    $ac = $Matches[2] -eq '8'
    $voltage = [int]$Matches[3]
    $material = $Matches[4]
    if (($ac -and $voltage -notin $acVoltages) -or (!$ac -and $voltage -notin $dcVoltages)) { continue }
    $details = $product.PRODUCT_DETAILS
    if ([string]$details.MANUFACTURER_PID -cne $code -or
        [string]$details.MANUFACTURER_NAME -cne 'Finder Spa' -or
        [string]$product.PRODUCT_FEATURES.REFERENCE_FEATURE_GROUP_ID -cne 'EC001652') { continue }
    $features = @{}
    foreach ($feature in $product.PRODUCT_FEATURES.FEATURE) { $features[[string]$feature.FNAME] = [string]$feature.FVALUE }
    $openCount = if ($type -in '21','23') { '1' } else { '2' }
    $closedCount = if ($type -eq '23') { '1' } else { '0' }
    if ($features['EF000227'] -ne '16' -or $features['EF008256'] -ne $openCount -or $features['EF008255'] -ne $closedCount) { continue }
    $supply = if ($ac) { 'AC' } else { 'DC' }
    if ([string]$details.DESCRIPTION_LONG -cnotmatch "^Modular step relays\s" -or
        [string]$details.DESCRIPTION_LONG -cnotmatch "Voltage type of supply voltage: $supply\s") { continue }
    if ($seen.ContainsKey($code)) { throw "Duplicate Finder order code $code" }
    $seen[$code] = $true
    $records.Add(@($code, $type, $supply, $voltage, $material))
}
ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 3
