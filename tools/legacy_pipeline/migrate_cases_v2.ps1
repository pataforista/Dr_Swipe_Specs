$PrefixesKeep = @{
    vitals = @("Enfermería reporta:", "El monitor muestra:", "Al tomar signos vitales:", "En el triage se anotó:")
    labs   = @("Laboratorio entregó reporte:", "Revisaste los resultados:", "El técnico de lab informa:", "Viste en el sistema:")
    notes  = @("A la exploración física:", "El paciente refiere:", "Notas en el expediente:", "Al interrogar al paciente:")
    meds   = @("El paciente confiesa:", "Al revisar sus medicamentos:", "Refiere automedicarse con:", "La receta previa indica:")
    imaging = @("La radiografía muestra:", "En el ultrasonido se ve:", "El reporte de imagen indica:", "Viste en la placa:")
    default = @("Dato clínico:", "Hallazgo:", "Evidencia:")
}

$PrefixesDiscard = @{
    vitals = @("Un interno te entrega por error:", "Viste una nota vieja de ayer:", "Un compañero te comenta de paso:", "Recordaste una cifra previa de:")
    labs   = @("Un técnico te entrega un resultado ajeno:", "Encontraste una hoja de lab sin nombre:", "Viste un resultado normal previo de:", "Recordaste que ayer la cifra era:")
    notes  = @("Un familiar menciona haber oído que:", "Un amigo del paciente te dice que:", "Recordaste un rumor sobre el paciente:", "Escuchaste en el pasillo que:")
    meds   = @("Viste una nota de una vitamina irrelevante:", "Un amigo menciona que el paciente toma té de:", "Recordaste leer sobre un suplemento de:", "El paciente dice que hace un año tomó:")
    imaging = @("Recordaste una placa de hace 2 años:", "El reporte de un estudio ajeno indica:", "Viste una radiografía de otro servicio de:", "Un interno menciona una placa normal de:")
    default = @("Dato anecdótico:", "Información redundante:", "Ruido en el expediente:")
}

function Clean-VazquezComment {
    param($comment, $isCorrect, $lethalRisk)
    if (-not $comment) { return "" }
    
    $clean = $comment -replace "^(Mendoza|Vazquez|Dr\. Vázquez|Dr\. Mendoza):\s*", ""
    
    if (-not $isCorrect) {
        if ($lethalRisk) {
            return "🚨 ¡ERROR CRÍTICO! $clean"
        } elseif ($clean.ToLower().Contains("ruido") -or $clean.ToLower().Contains("irrelevante") -or $clean.ToLower().Contains("basura")) {
            return "🧹 DESCARTE RECOMENDADO: $clean"
        } else {
            return "🎯 DATO CLAVE OMITIDO: $clean"
        }
    }
    return $clean
}

$files = Get-ChildItem -Path "cases" -Filter "*.json"
$count = 0

foreach ($file in $files) {
    try {
        $data = Get-Content $file.FullName -Raw | ConvertFrom-Json
        if (-not $data.card_stream) { continue }

        foreach ($card in $data.card_stream) {
            $scoring = $card.scoring
            $flags = $card.safety_flags
            $lethal = $flags.lethal_risk -eq $true
            $critical = $flags.decision_critical -eq $true
            $errorType = $scoring.error_type

            # Logic Override
            if ($lethal -or $critical -or @("lethal_omission", "omission", "lethal_hazard") -contains $errorType) {
                $card.expected_action = "keep"
            } elseif ($errorType -eq "hoarding") {
                $card.expected_action = "discard"
            }

            # Narrative Layer
            $action = $card.expected_action
            $category = "default"
            if ($card.category) { $category = $card.category.ToLower() }
            
            $source = if ($action -eq "keep") { $PrefixesKeep } else { $PrefixesDiscard }
            if (-not $source.ContainsKey($category)) { $category = "default" }
            
            $options = $source[$category]
            $prefix = $options[(Get-Random -Maximum $options.Count)]
            $text = $card.card_text

            $allPrefixes = $PrefixesKeep.default + $PrefixesDiscard.default
            $hasPrefix = $false
            foreach ($p in $allPrefixes) {
                if ($text.StartsWith($p)) { $hasPrefix = $true; break }
            }

            if (-not $hasPrefix) {
                $card.card_text = "$prefix $text"
            }

            # Feedback
            if ($scoring.vazquez_comment) {
                $scoring.vazquez_comment = Clean-VazquezComment -comment $scoring.vazquez_comment -isCorrect ($action -eq "keep") -lethalRisk $lethal
            }
        }

        $data | ConvertTo-Json -Depth 10 | Set-Content $file.FullName -Encoding utf8
        $count++
        if ($count % 100 -eq 0) { Write-Host "Processed $count cases..." }
    } catch {
        Write-Warning "Failed to process $($file.Name): $($_.Exception.Message)"
    }
}

Write-Host "FINISHED. Processed $count cases total."
