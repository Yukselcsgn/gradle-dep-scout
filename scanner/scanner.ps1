$javaFiles = Get-ChildItem -Path $basePath -Recurse -Filter *.java


$imports = @()
foreach ($file in $javaFiles) {
    $lines = Get-Content $file.FullName
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        if ($trimmed -match '^import ') {
            $clean = $trimmed -replace '^import\s+', '' -replace ';$','' -replace '^static\s+',''
            $imports += $clean.Trim()
        }
    }
}

$imports | Sort-Object -Unique | Set-Content "imports.txt"