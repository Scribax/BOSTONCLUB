
$paths = @("C:\ProgramData", "C:\Users\Scribax\AppData\Local", "C:\Users\Scribax\AppData\Roaming")
$report = @()

foreach ($p in $paths) {
    if (Test-Path $p) {
        Write-Host "Analizando $p..." -ForegroundColor Cyan
        $subfolders = Get-ChildItem -Path $p -Directory
        foreach ($folder in $subfolders) {
            try {
                $files = Get-ChildItem -Path $folder.FullName -Recurse -File -ErrorAction SilentlyContinue
                $size = ($files | Measure-Object -Property Length -Sum).Sum / 1GB
                if ($size -gt 0.5) {
                    $report += [PSCustomObject]@{
                        Path = $folder.FullName
                        SizeGB = [Math]::Round($size, 2)
                    }
                }
            } catch { }
        }
    }
}

$report | Sort-Object SizeGB -Descending | Format-Table -AutoSize
