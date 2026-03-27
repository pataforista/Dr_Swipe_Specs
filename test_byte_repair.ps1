$latin1 = [System.Text.Encoding]::GetEncoding("ISO-8859-1")
$mangled_o = $latin1.GetString(@(0xC3, 0xB3))
$mangled_n = $latin1.GetString(@(0xC3, 0xB1))

Write-Host "Mangled o: $mangled_o"
Write-Host "Mangled n: $mangled_n"

$sample = "Marta, 61 aÃ±os"
if ($sample.Contains($mangled_n)) {
    Write-Host "Found mangled n!"
    Write-Host ($sample.Replace($mangled_n, "n"))
}
