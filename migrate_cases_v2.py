import json
import os
import random
import re

# Configuración de prefijos
PREFIXES = {
    "keep": {
        "vitals": ["Enfermería reporta:", "El monitor muestra:", "Al tomar signos vitales:", "En el triage se anotó:"],
        "labs": ["Laboratorio entregó reporte:", "Revisaste los resultados:", "El técnico de lab informa:", "Viste en el sistema:"],
        "notes": ["A la exploración física:", "El paciente refiere:", "Notas en el expediente:", "Al interrogar al paciente:"],
        "meds": ["El paciente confiesa:", "Al revisar sus medicamentos:", "Refiere automedicarse con:", "La receta previa indica:"],
        "imaging": ["La radiografía muestra:", "En el ultrasonido se ve:", "El reporte de imagen indica:", "Viste en la placa:"],
        "default": ["Dato clínico:", "Hallazgo:", "Evidencia:"]
    },
    "discard": {
        "vitals": ["Un interno te entrega por error:", "Viste una nota vieja de ayer:", "Un compañero te comenta de paso:", "Recordaste una cifra previa de:"],
        "labs": ["Un técnico te entrega un resultado ajeno:", "Encontraste una hoja de lab sin nombre:", "Viste un resultado normal previo de:", "Recordaste que ayer la cifra era:"],
        "notes": ["Un familiar menciona haber oído que:", "Un amigo del paciente te dice que:", "Recordaste un rumor sobre el paciente:", "Escuchaste en el pasillo que:"],
        "meds": ["Viste una nota de una vitamina irrelevante:", "Un amigo menciona que el paciente toma té de:", "Recordaste leer sobre un suplemento de:", "El paciente dice que hace un año tomó:"],
        "imaging": ["Recordaste una placa de hace 2 años:", "El reporte de un estudio ajeno indica:", "Viste una radiografía de otro servicio de:", "Un interno menciona una placa normal de:"],
        "default": ["Dato anecdótico:", "Información redundante:", "Ruido en el expediente:"]
    }
}

def clean_comment(comment, is_correct, lethal_risk=False):
    if not comment:
        return ""
    
    # Remove existing prefixes like "Mendoza:" or "Vazquez:"
    comment = re.sub(r'^(Mendoza|Vazquez|Dr\. Vázquez|Dr\. Mendoza):\s*', '', comment)
    
    if not is_correct:
        if lethal_risk:
            return f"🚨 ¡ERROR CRÍTICO! {comment}"
        elif "ruido" in comment.lower() or "irrelevante" in comment.lower():
            return f"🧹 DESCARTE RECOMENDADO: {comment}"
        else:
            return f"🎯 DATO CLAVE OMITIDO: {comment}"
    return comment

def migrate_case(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            case_data = json.load(f)
        
        if 'card_stream' not in case_data:
            return False
        
        for card in case_data['card_stream']:
            # 1. Determinar Lógica Lógica (Keep vs Discard)
            scoring = card.get('scoring', {})
            error_type = scoring.get('error_type', '')
            safety_flags = card.get('safety_flags', {})
            lethal_risk = safety_flags.get('lethal_risk', False)
            decision_critical = safety_flags.get('decision_critical', False)
            
            # Logic override: If it's lethal or critical, it MUST be kept.
            if lethal_risk or decision_critical or error_type in ['lethal_omission', 'omission', 'lethal_hazard']:
                card['expected_action'] = 'keep'
            elif error_type == 'hoarding':
                card['expected_action'] = 'discard'
            
            # 2. Aplicar Capa Narrativa
            action = card['expected_action']
            category = card.get('category', 'default').lower()
            if category not in PREFIXES[action]:
                category = 'default'
            
            prefix = random.choice(PREFIXES[action][category])
            text = card.get('card_text', '')
            
            # Evitar duplicar prefijos si ya tiene uno
            if not any(text.startswith(p) for p in PREFIXES['keep']['default'] + PREFIXES['discard']['default']):
                card['card_text'] = f"{prefix} {text}"
            
            # 3. Refinar Comentarios
            if 'vazquez_comment' in scoring:
                scoring['vazquez_comment'] = clean_comment(scoring['vazquez_comment'], action == 'keep', lethal_risk)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(case_data, f, indent=2, ensure_ascii=False)
            
        return True
    except Exception as e:
        print(f"Error in {file_path}: {e}")
        return False

def main():
    cases_dir = 'cases'
    count = 0
    for filename in os.listdir(cases_dir):
        if filename.endswith('.json'):
            if migrate_case(os.path.join(cases_dir, filename)):
                count += 1
                if count % 100 == 0:
                    print(f"Processed {count} cases...")
    
    print(f"FINISHED. Processed {count} cases total.")

if __name__ == "__main__":
    main()
