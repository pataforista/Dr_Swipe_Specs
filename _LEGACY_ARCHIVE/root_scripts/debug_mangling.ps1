$path = "cases/CASE_PROC_SURG_OBSTRUCTION_001_010.json"
$bytes = [System.IO.File]::ReadAllBytes($path)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$text.Substring(0, 500) | Out-File -FilePath "mangled_sample.txt" -Encoding utf8
