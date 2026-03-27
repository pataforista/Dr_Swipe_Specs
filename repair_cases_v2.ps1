# =============================================================
# REPAIR SCRIPT v2: Dr. Swipe Mass Content Refinement
# Refección de encoding, narrativa e integridad lógica
# =============================================================

$casesDir = "cases"
$files = Get-ChildItem -Path $casesDir -Filter "*.json" | Where-Object { $_.Name -ne "case_index.json" }

# 1. Mapa de Reparación de Encoding (UTF-8 recovery)
$encodingMap = @{
    "Ã³" = "ó"; "Ã¡" = "á"; "Ã©" = "é"; "Ã­" = "í"; "Ãº" = "ú";
    "Ã±" = "ñ"; "Ã‘" = "Ñ"; "Ã¼" = "ü"; "Âº" = "°"; "Â¿" = "¿";
    "Â¡" = "¡"; "â€œ" = "“"; "â€" = "”"; "Â" = ""
}

# 2. Mapa de Refinamiento Narrativo
$refinementPrefixes = @(
    "Hallazgo clínico:", "El monitor muestra:", "La nota de triage indica:", 
    "En la exploración física:", "El reporte indica:", "Se observa en el paciente:",
    "Dato de importancia:", "Hallazgo:", "Evidencia clínica:"
)

function Repair-String {
    param($text)
    if (-not $text) { return $text }
    $newText = $text
    foreach ($key in $encodingMap.Keys) {
        $newText = $newText.Replace($key, $encodingMap[$key])
    }
    # Limpieza de prefijos dobles
    $newText = $newText -replace "^Enfermería reporta: El monitor muestra:", "El monitor muestra:"
    $newText = $newText -replace "^Enfermería reporta: Enfermería reporta:", "Enfermería reporta:"
    # Reemplazo de "Dato clínico:" aburrido
    if ($newText.StartsWith("Dato clínico:")) {
        $newPrefix = $refinementPrefixes | Get-Random
        $newText = $newText -replace "^Dato clínico:", $newPrefix
    }
    return $newText
}

Write-Host "🚀 Iniciando reparación masiva de $($files.Count) casos..." -ForegroundColor Cyan

$utf8NoBOM = New-Object System.Text.UTF8Encoding($false)
$count = 0

foreach ($file in $files) {
    try {
        # Leer como UTF8
        $raw = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        
        # Aplicar reparaciones de string antes de parsear JSON para capturar todo el archivo
        $repairedRaw = Repair-String -text $raw
        
        # Parsear para correcciones lógicas
        $data = $repairedRaw | ConvertFrom-Json
        
        if ($data.card_stream) {
            foreach ($card in $data.card_stream) {
                # Reparar textos de card y vazquez manual (por si acaso quedaron fuera)
                $card.card_text = Repair-String -text $card.card_text
                if ($card.scoring.vazquez_comment) {
                    $card.scoring.vazquez_comment = Repair-String -text $card.scoring.vazquez_comment
                }

                # Auditoría de init_vitals: Si hay datos patológicos, forzar KEEP
                if ($card.card_id -eq "init_vitals" -or $card.category -eq "vitals") {
                    $isPathological = $false
                    if ($card.card_text -match "90/60|80/50|70/40") { $isPathological = $true } # Hipotensión
                    if ($card.card_text -match "110|120|130|140") { $isPathological = $true }   # Taquicardia
                    if ($card.card_text -match "38\.|39\.") { $isPathological = $true }         # Fiebre
                    
                    if ($isPathological) {
                        $card.expected_action = "keep"
                        $card.scoring.error_type = "omission"
                    }
                }
            }
        }

        # Guardar como UTF-8 sin BOM
        $finalJson = $data | ConvertTo-Json -Depth 10
        [System.IO.File]::WriteAllText($file.FullName, $finalJson, $utf8NoBOM)
        
        $count++
        if ($count % 100 -eq 0) { Write-Host "Progreso: $count casos reparados..." -ForegroundColor Green }
    } catch {
        Write-Warning "Error reparando $($file.Name): $($_.Exception.Message)"
    }
}

Write-Host "✅ REPARACIÓN FINALIZADA. $count casos procesados con éxito." -ForegroundColor Cyan
