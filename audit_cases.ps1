$casesDir = "cases"
$files = Get-ChildItem -Path $casesDir -Filter "*.json" | Where-Object { $_.Name -ne "case_index.json" }

$knownPrefixes = @(
    "Enfermeria reporta:", "El monitor muestra:", "Al tomar signos vitales:", "En el triage se anoto:",
    "Laboratorio entrego reporte:", "Revisaste los resultados:", "El tecnico de lab informa:", "Viste en el sistema:",
    "A la exploracion fisica:", "El paciente refiere:", "Notas en el expediente:", "Al interrogar al paciente:",
    "El paciente confiesa:", "Al revisar sus medicamentos:", "La receta previa indica:",
    "La radiografia muestra:", "En el ultrasonido se ve:", "El reporte de imagen indica:", "Viste en la placa:",
    "Dato clinico:", "Hallazgo:", "Evidencia:", "Dato anecdotico:", "Informacion redundante:", "Ruido en el expediente:",
    "Un interno te entrega por error:", "Viste una nota vieja de ayer:", "Un companero te comenta de paso:",
    "Un tecnico te entrega un resultado ajeno:", "Encontraste una hoja de lab sin nombre:", "Viste un resultado normal previo de:",
    "Un familiar menciona haber oido que:", "Un amigo del paciente te dice que:", "Recordaste un rumor sobre el paciente:",
    "Viste una nota de una vitamina irrelevante:", "Recordaste leer sobre un suplemento de:", "El paciente dice que hace un anno tomo:",
    "Recordaste una placa de hace 2 annos:", "El reporte de un estudio ajeno indica:", "Un interno menciona una placa normal de:",
    "Informacion redundante:", "Recordaste una cifra previa de:", "Escuchaste en el pasillo que:",
    "Enferm", "El monitor", "Al tomar", "En el tri", "Laborator", "Revisaste", "El tecnic", "Viste en",
    "A la expl", "El pacien", "Notas en", "Al interr", "La receta", "La radiog", "En el ult", "El report",
    "Dato clin", "Hallazgo:", "Evidencia", "Dato anec", "Informaci", "Ruido en",
    "Un intern", "Viste una", "Un compa", "Un tecni", "Encontras", "Un famil", "Un amigo",
    "Recordast", "Escuchas"
)

$totalCards = 0
$withPrefix = 0
$logicOK = 0
$logicBad = 0
$oldPrefixComments = 0
$noComments = 0
$issueLog = @()

$sampledFiles = $files | Get-Random -Count 50
Write-Host "Auditando $($sampledFiles.Count) casos..." 

foreach ($file in $sampledFiles) {
    try {
        $raw = Get-Content $file.FullName -Raw -Encoding utf8
        $data = $raw | ConvertFrom-Json
        if (-not $data.card_stream) { continue }
        
        $fileHasIssue = $false

        foreach ($card in $data.card_stream) {
            $totalCards++
            $text = if ($card.card_text) { $card.card_text } else { "" }
            $action = $card.expected_action
            $errorType = if ($card.scoring.error_type) { $card.scoring.error_type } else { "" }
            $lethalRisk = $card.safety_flags.lethal_risk -eq $true
            $decCrit = $card.safety_flags.decision_critical -eq $true
            $comment = if ($card.scoring.vazquez_comment) { $card.scoring.vazquez_comment } else { "" }
            
            # Check prefix (simple substring check on normalized text)
            $normText = $text -replace "[^a-zA-Z]", " "
            $hasP = $false
            foreach ($p in $knownPrefixes) {
                $normP = $p -replace "[^a-zA-Z]", " "
                if ($normText.StartsWith($normP.Substring(0, [Math]::Min(8, $normP.Length)))) {
                    $hasP = $true
                    break
                }
            }
            if ($hasP) { $withPrefix++ }
            else {
                if (-not $fileHasIssue) {
                    $issueLog += "FILE: $($file.Name)"
                    $fileHasIssue = $true
                }
                $short = if ($text.Length -gt 60) { $text.Substring(0,60) + "..." } else { $text }
                $issueLog += "  NO_PREFIX [$($card.card_id)]: $short"
            }
            
            # Check logic
            $expectKeep = $lethalRisk -or $decCrit -or ($errorType -in @("lethal_omission","omission","lethal_hazard"))
            $expectDiscard = $errorType -eq "hoarding"
            
            if ($expectKeep -and $action -ne "keep") {
                $logicBad++
                if (-not $fileHasIssue) { $issueLog += "FILE: $($file.Name)"; $fileHasIssue = $true }
                $issueLog += "  LOGIC_ERR [$($card.card_id)]: should=keep, got=$action, errorType=$errorType"
            } elseif ($expectDiscard -and $action -ne "discard") {
                $logicBad++
                if (-not $fileHasIssue) { $issueLog += "FILE: $($file.Name)"; $fileHasIssue = $true }
                $issueLog += "  LOGIC_ERR [$($card.card_id)]: should=discard, got=$action"
            } else {
                $logicOK++
            }
            
            # Check old comment prefixes
            if ($comment -match "^Mendoza:" -or $comment -match "^Vazquez:") {
                $oldPrefixComments++
            }
            
            if (-not $comment) { $noComments++ }
        }
    } catch {
        $issueLog += "ERROR: $($file.Name) => $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "====== AUDIT RESULTS ======"
Write-Host "Total cards audited:  $totalCards"
Write-Host "With narrative prefix: $withPrefix / $totalCards"
Write-Host "Logic OK:             $logicOK / $totalCards"
Write-Host "Logic ERRORS:         $logicBad"
Write-Host "Old Mendoza comments: $oldPrefixComments"
Write-Host "Cards without comment: $noComments"
Write-Host ""
Write-Host "====== ISSUES FOUND ======"
if ($issueLog.Count -eq 0) {
    Write-Host "No issues found in the sample!"
} else {
    $issueLog | ForEach-Object { Write-Host $_ }
}
