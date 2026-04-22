
$rootFolders = Get-ChildItem -Path C:\ -Directory
$report = @()

foreach ($folder in $rootFolders) {
    Write-Host "Analizando $($folder.FullName)..." -ForegroundColor Cyan
    try {
        $files = Get-ChildItem -Path $folder.FullName -Recurse -File -ErrorAction SilentlyContinue
        $size = ($files | Measure-Object -Property Length -Sum).Sum / 1GB
        $report += [PSCustomObject]@{
            Path = $folder.FullName
            SizeGB = [Math]::Round($size, 2)
        }
    } catch {
        Write-Host "Error al acceder a $($folder.FullName)" -ForegroundColor Red
    }
}

Write-Host "`n--- RESULTADO DEL ANÁLISIS ---" -ForegroundColor Green
$report | Sort-Object SizeGB -Descending | Format-Table -AutoSize
