# =============================================================
# REPAIR SCRIPT v3: Dr. Swipe Mass Content Refinement
# Refección de encoding, narrativa e integridad lógica
# =============================================================

$casesDir = "cases"
$files = Get-ChildItem -Path $casesDir -Filter "*.json" | Where-Object { $_.Name -ne "case_index.json" }

# 1. Definir Reparaciones de Encoding de forma segura (sin literales complejos en hash)
function Fix-Encoding {
    param($text)
    if (-not $text) { return $text }
    $t = $text
    $t = $t.Replace("Ã³", "ó")
    $t = $t.Replace("Ã¡", "á")
    $t = $t.Replace("Ã©", "é")
    $t = $t.Replace("Ã­", "í")
    $t = $t.Replace("Ãº", "ú")
    $t = $t.Replace("Ã±", "ñ")
    $t = $t.Replace("Ã‘", "Ñ")
    $t = $t.Replace("Ã¼", "ü")
    $t = $t.Replace("Âº", "°")
    $t = $t.Replace("Â¿", "¿")
    $t = $t.Replace("Â¡", "¡")
    return $t
}

# 2. Mapa de Refinamiento Narrativo por Categoría
$NarrativeMap = @{
    "vitals" = @("El monitor muestra:", "Enfermería reporta:", "La nota de triage indica:", "Al tomar signos vitales:")
    "labs"   = @("Laboratorio entregó reporte:", "Revisaste los resultados:", "El técnico de lab informa:", "Viste en el sistema:")
    "notes"  = @("A la exploración física:", "El paciente refiere:", "Notas en el expediente:", "Al interrogar al paciente:")
    "meds"   = @("El paciente admite:", "Al revisar sus medicamentos:", "Refiere automedicarse con:", "La receta previa indica:")
    "imaging" = @("La radiografía muestra:", "En el ultrasonido se ve:", "El reporte de imagen indica:", "Viste en la placa:")
}
$DefaultRefinements = @("Hallazgo clínico:", "Hallazgo:", "Evidencia clínica:", "Dato de importancia:")

function Refine-Narrative {
    param($card)
    $text = $card.card_text
    if (-not $text) { return $text }
    
    # Reparar encodings primero
    $text = Fix-Encoding -text $text
    
    # Reemplazar "Dato clínico:" aburrido
    if ($text.StartsWith("Dato clínico:")) {
        $category = if ($card.category) { $card.category.ToLower() } else { "default" }
        $options = if ($NarrativeMap.ContainsKey($category)) { $NarrativeMap[$category] } else { $DefaultRefinements }
        $newPrefix = $options | Get-Random
        $text = $text -replace "^Dato clínico:", $newPrefix
    }
    
    # Limpiar duplicados de prefijos que pudieron quedar de la migración anterior
    $text = $text -replace "^Enfermería reporta: El monitor muestra:", "El monitor muestra:"
    $text = $text -replace "^Enfermería reporta: Enfermería reporta:", "Enfermería reporta:"
    $text = $text -replace "^Evidencia: El monitor muestra:", "El monitor muestra:"
    $text = $text -replace "^Enfermería reporta: Informaci[oó]n redundante:", "Información redundante:"
    
    return $text
}

Write-Host "🚀 Iniciando reparación masiva v3 de $($files.Count) casos..." -ForegroundColor Cyan

$utf8NoBOM = New-Object System.Text.UTF8Encoding($false)
$count = 0

foreach ($file in $files) {
    try {
        # Leer como UTF8
        $raw = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        
        # Reparar todo el archivo (incluyendo headers y comentarios de vazquez)
        $repairedRaw = Fix-Encoding -text $raw
        
        # Parsear para correcciones lógicas más finas
        $data = $repairedRaw | ConvertFrom-Json
        
        if ($data.card_stream) {
            foreach ($card in $data.card_stream) {
                # Refinar narrativa y limpiar duplicados por tarjeta
                $card.card_text = Refine-Narrative -card $card
                
                if ($card.scoring.vazquez_comment) {
                    $card.scoring.vazquez_comment = Fix-Encoding -text $card.scoring.vazquez_comment
                }

                # Auditoría de vitales patológicos: Forzar KEEP
                if ($card.card_id -eq "init_vitals" -or $card.category -match "vital|Signos") {
                    $text = $card.card_text
                    $isBad = $text -match "90/60|80/50|70/40|120 lpm|130 lpm|140 lpm|38\.[5-9]|39\."
                    if ($isBad) {
                        $card.expected_action = "keep"
                        if ($card.scoring.error_type -eq "hoarding") {
                             $card.scoring.error_type = "omission"
                        }
                    }
                }
            }
        }

        # Guardar como UTF-8 sin BOM con profundidad suficiente
        $finalJson = $data | ConvertTo-Json -Depth 12
        [System.IO.File]::WriteAllText($file.FullName, $finalJson, $utf8NoBOM)
        
        $count++
        if ($count % 100 -eq 0) { Write-Host "Progreso: $count casos reparados..." -ForegroundColor Green }
    } catch {
        Write-Warning "Error reparando $($file.Name): $($_.Exception.Message)"
    }
}

Write-Host "✅ REPARACIÓN FINALIZADA. $count casos procesados con éxito." -ForegroundColor Cyan
