# =============================================================
# REPAIR SCRIPT v4: Dr. Swipe Mass Content Refinement
# Refeccion de encoding, narrativa e integridad logica
# =============================================================

$casesDir = "cases"
$files = Get-ChildItem -Path $casesDir -Filter "*.json" | Where-Object { $_.Name -ne "case_index.json" }

# 1. Definir Reparaciones de Encoding usando char codes para evitar errores de sintaxis
function Fix-Encoding {
    param($text)
    if (-not $text) { return $text }
    $t = $text
    $t = $t.Replace("Ã³", "o") # Usaremos reemplazo simple sin acentos si PS falla, o mejor:
    $t = $t.Replace("Ã³", [char]243) # ó
    $t = $t.Replace("Ã¡", [char]225) # á
    $t = $t.Replace("Ã©", [char]233) # é
    $t = $t.Replace("Ã­", [char]237) # í
    $t = $t.Replace("Ãº", [char]250) # ú
    $t = $t.Replace("Ã±", [char]241) # ñ
    $t = $t.Replace("Ã‘", [char]209) # Ñ
    $t = $t.Replace("Ã¼", [char]252) # ü
    $t = $t.Replace("Âº", [char]176) # °
    $t = $t.Replace("Â¿", [char]191) # ¿
    $t = $t.Replace("Â¡", [char]161) # ¡
    return $t
}

# 2. Mapa de Refinamiento Narrativo por Categoria (Nombres en ASCII para seguridad)
$NarrativeMap = @{
    "vitals" = @("El monitor muestra:", "Enfermeria reporta:", "La nota de triage indica:", "Al tomar signos vitales:")
    "labs"   = @("Laboratorio entrego reporte:", "Revisaste los resultados:", "El tecnico de lab informa:", "Viste en el sistema:")
    "notes"  = @("A la exploracion fisica:", "El paciente refiere:", "Notas en el expediente:", "Al interrogar al paciente:")
    "meds"   = @("El paciente admite:", "Al revisar sus medicamentos:", "Refiere automedicarse con:", "La receta previa indica:")
    "imaging" = @("La radiografia muestra:", "En el ultrasonido se ve:", "El reporte de imagen indica:", "Viste en la placa:")
}
$DefaultRefinements = @("Hallazgo clinico:", "Hallazgo:", "Evidencia clinica:", "Dato de importancia:")

function Refine-Narrative {
    param($card)
    $text = $card.card_text
    if (-not $text) { return $text }
    
    # Reparar encodings
    $text = Fix-Encoding -text $text
    
    # Reemplazar "Dato clinico:" genérico
    if ($text.StartsWith("Dato clinico:") -or $text.StartsWith("Dato cl")) {
        $category = if ($card.category) { $card.category.ToLower() } else { "default" }
        $options = if ($NarrativeMap.ContainsKey($category)) { $NarrativeMap[$category] } else { $DefaultRefinements }
        $newPrefix = $options | Get-Random
        $text = $text -replace "^Dato cl[ií]nico:", $newPrefix
    }
    
    # Limpiar duplicados y basura de la migracion anterior
    $text = $text -replace "^Enfermeria reporta: El monitor muestra:", "El monitor muestra:"
    $text = $text -replace "^Enfermeria reporta: Enfermeria reporta:", "Enfermeria reporta:"
    $text = $text -replace "^Evidencia: El monitor muestra:", "El monitor muestra:"
    
    return $text
}

Write-Host "Iniciando reparacion masiva v4 de $($files.Count) casos..."

$utf8NoBOM = New-Object System.Text.UTF8Encoding($false)
$count = 0

foreach ($file in $files) {
    try {
        $raw = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $repairedRaw = Fix-Encoding -text $raw
        $data = $repairedRaw | ConvertFrom-Json
        
        if ($data.card_stream) {
            foreach ($card in $data.card_stream) {
                # Refinar narrativa
                $card.card_text = Refine-Narrative -card $card
                
                # Vazquez comments
                if ($card.scoring.vazquez_comment) {
                    $card.scoring.vazquez_comment = Fix-Encoding -text $card.scoring.vazquez_comment
                }

                # Auditoria de vitales
                if ($card.card_id -eq "init_vitals" -or ($card.category -match "vital|Signos")) {
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

        $finalJson = $data | ConvertTo-Json -Depth 12
        [System.IO.File]::WriteAllText($file.FullName, $finalJson, $utf8NoBOM)
        
        $count++
        if ($count % 100 -eq 0) { Write-Host "Progreso: $count casos..." }
    } catch {
        Write-Warning "Error reparando $($file.Name): $($_.Exception.Message)"
    }
}

Write-Host "REPARACION FINALIZADA. $count casos procesados."
