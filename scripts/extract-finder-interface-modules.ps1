param([Parameter(Mandatory)][string]$Archive)
$ErrorActionPreference = 'Stop'
$zip = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Archive).Path)
try {
    $entry = $zip.GetEntry('FINBMECAT_ENG_20260824_3996421788343213.xml')
    if (!$entry) { throw 'Expected Finder English BMEcat data dated 2026-08-24.' }
    $reader = [IO.StreamReader]::new($entry.Open())
    try { [xml]$catalog = $reader.ReadToEnd() } finally { $reader.Dispose() }
} finally { $zip.Dispose() }

$profiles = @{
    '4812' = @('9','5007',2,8); '48P2' = @('9','5007',2,8)
    '4832' = @('9','5060',2,8)
    '4831' = @('78','0050|0060|5050|5060',1,10); '48P3' = @('78','0050|0060|5050|5060',1,10)
    '4852' = @('78','0050|0060|5050|5060',2,8); '48P5' = @('78','0050|0060|5050|5060',2,8)
    '4861' = @('78','1050|1060|4050|4060',1,16); '48P6' = @('78','1050|1060|4050|4060',1,16)
    '4862' = @('7','0050|4050',2,10); '48P8' = @('7','0050|4050',2,10)
    '5832' = @('89','0050|0060|5050|5060',2,10); '5833' = @('89','0050|0060|5050|5060',3,10)
    '5834' = @('89','0050|0060|5050|5060',4,7); '58P3' = @('89','0050|0060|5050|5060',3,10)
    '58P4' = @('89','0050|0060|5050|5060',4,7)
}
$records = @{}
foreach ($product in $catalog.SelectNodes('//*[local-name()="PRODUCT"]')) {
    $code = [string]$product.SUPPLIER_PID
    if ($code -cnotmatch '^((?:48|58)[0-9P]\d)([789])(\d{3})(\d{4})(SP[AB]|SM[AB])$') { continue }
    $type = $Matches[1]
    $mode = $Matches[2]
    $voltage = [int]$Matches[3]
    $options = $Matches[4]
    $package = $Matches[5]
    $profile = $profiles[$type]
    if (!$profile -or !$profile[0].Contains($mode) -or $options -cnotmatch ('^(?:' + $profile[1] + ')$')) { continue }
    $series = $type.Substring(0,2)
    $ac = $mode -eq '8'
    $supply = if ($ac) { 'AC' } else { 'DC' }
    $option = [string]$options[2]
    $voltageList = if ($type -in '4812','48P2') { 12,24 } elseif ($type -eq '4832') { 24 }
        elseif ($series -eq '58' -and $ac) { 12,24,48,110,120,230 }
        elseif ($series -eq '58') { 12,24,48,125 }
        elseif ($ac) { 12,24,110,120,230 } else { 12,24,125 }
    $standardOption = if ($ac) { '6' } else { '5' }
    if ($voltage -notin $voltageList -or
        ($type -notin '4812','48P2','4832' -and $option -ne $standardOption)) { continue }
    $details = $product.PRODUCT_DETAILS
    if ([string]$details.MANUFACTURER_PID -cne $code -or [string]$details.MANUFACTURER_NAME -cne 'Finder Spa' -or
        [string]$product.PRODUCT_FEATURES.REFERENCE_FEATURE_GROUP_ID -cne 'EC001437') { continue }
    $description = [string]$details.DESCRIPTION_LONG
    $poles = $profile[2]
    $rating = $profile[3]
    if ($description -cnotmatch ('Volt ' + $supply + ": $voltage V\.") -or
        $description -notmatch "Nr\.contacts: $poles\s" -or $description -notmatch "\(A\): $rating A\." -or
        $description -notmatch 'Contacts configuration: CO\s') { continue }
    $key = $code.Substring(0,12)
    $rank = @('SPA','SMA','SPB','SMB').IndexOf($package)
    if (!$records.ContainsKey($key) -or $rank -lt $records[$key].Rank) {
        $records[$key] = @{ Rank = $rank; Row = @($code,$type,$voltage,$supply,$options,$poles,$rating) }
    }
}
ConvertTo-Json -InputObject @($records.Values | Sort-Object { $_.Row[0] } | ForEach-Object { ,$_.Row }) -Compress -Depth 3

