# Test: Read as Latin1, replace, and write as UTF8 without BOM
$path = "cases/CASE_PROC_SURG_OBSTRUCTION_001_010.json"
$latin1 = [System.Text.Encoding]::GetEncoding("ISO-8859-1")
$utf8NoBOM = New-Object System.Text.UTF8Encoding($false)

$raw = [System.IO.File]::ReadAllText($file.FullName, $latin1)
# At this point, "ó" is "Ã³" in the string.
$repaired = $raw.Replace("Ã³", "o") # Just testing "o" first to see if it catches it
# Actually, I'll test the actual characters "Ã" (C3) and "³" (B3)
$c3 = [char]0xC3
$b3 = [char]0xB3
$repaired = $raw.Replace("$c3$b3", "o")

# Output for verification
Write-Host "Found $($repaired.Contains('o'))"
