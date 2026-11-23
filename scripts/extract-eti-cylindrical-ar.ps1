param([Parameter(Mandatory)][string]$Catalog)

$ErrorActionPreference = 'Stop'
$settings = [Xml.XmlReaderSettings]::new()
$settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
$reader = [Xml.XmlReader]::Create((Resolve-Path -LiteralPath $Catalog).Path, $settings)
$records = [System.Collections.Generic.List[object]]::new()
$seen = @{}

try {
    while ($reader.Read()) {
        if ($reader.NodeType -ne [Xml.XmlNodeType]::Element -or $reader.LocalName -ne 'PRODUCT') { continue }
        $subtree = $reader.ReadSubtree()
        try { $product = ([Xml.Linq.XDocument]::Load($subtree)).Root }
        finally { $subtree.Dispose() }
        $ns = $product.Name.Namespace
        $code = $product.Element($ns + 'SUPPLIER_PID').Value
        $details = $product.Element($ns + 'PRODUCT_DETAILS')
        if ($code -cnotmatch '^002\d{6}$' -or $details.Element($ns + 'MANUFACTURER_PID').Value -cne $code -or
            $details.Element($ns + 'MANUFACTURER_NAME').Value -cne 'ETI') { continue }
        $name = $details.Element($ns + 'DESCRIPTION_SHORT').Value
        if ($name -cnotmatch '^Fuse link, CH((?:10x38|14x51(?:/P)?|22x58(?:/P)?)) aR (\d+)A/(500|600|690)V$') { continue }
        $format = $Matches[1]
        $current = [int]$Matches[2]
        $voltage = [int]$Matches[3]
        $size = $format -replace '/P$', ''
        $description = $details.Element($ns + 'DESCRIPTION_LONG').Value
        if ($description -cnotmatch "Dimensions $size," -or $description -cnotmatch "Rated current \(A\) $current," -or
            $description -cnotmatch "Rated AC voltage \(V\) $voltage," -or $description -cnotmatch 'Characteristics aR,' -or
            $description -cnotmatch 'Breaking capacity AC \(kA\) 200,') { continue }
        if ($seen.ContainsKey($code)) { throw "Duplicate ETI order code $code" }
        $seen[$code] = $true
        $records.Add(@($code, $format, 'aR', $current, $voltage, 200))
    }
} finally {
    $reader.Dispose()
}
ConvertTo-Json -InputObject @($records | Sort-Object { $_[0] }) -Compress -Depth 3
