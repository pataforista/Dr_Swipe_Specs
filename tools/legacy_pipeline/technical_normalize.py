import json
import os
import re

# Comprehensive Category Mapping based on the scan
CATEGORY_MAP = {
    # Vitals
    'Signos Vitales': 'vitals', 'Signo Vital': 'vitals', 'HAS': 'vitals', 'Volemia': 'vitals',
    'Fase Clnica': 'vitals', 'Gravedad': 'vitals', 'Severidad': 'vitals',
    # Labs
    'Laboratorio': 'labs', 'Laboratorios': 'labs', 'Gabinete/Lab': 'labs', 'Gabinete/Labs': 'labs',
    'Biomarcadores': 'labs', 'Electrolitos': 'labs', 'Paraclnicos': 'labs', 'Pruebas de Laboratorio': 'labs',
    'Anion Gap': 'labs', 'Hematologa': 'labs', '🧪': 'labs',
    # Imaging
    'Imagen': 'imaging', 'Imagenologa': 'imaging', 'Ultrasonido': 'imaging', 'Tomografa': 'imaging',
    'Signo Radiolgico': 'imaging', 'imaging': 'imaging', 'Estudio de Imagen': 'imaging',
    # Meds
    'Tratamiento': 'meds', 'Tratamiento ATB': 'meds', 'meds': 'meds', 'Farmacologa': 'meds',
    'Frmacos': 'meds', 'Antibioticoterapia': 'meds', 'Insulinoterapia': 'meds', 'Antihipertensivo': 'meds',
    'Farmacoterapia': 'meds', '💊': 'meds',
    # Notes
    'Anamnesis': 'notes', 'notes': 'notes', 'Historia': 'notes', 'Interrogatorio': 'notes',
    'Notas de Paramdico': 'notes', 'Exploracin Fsica': 'notes', 'Exploracin': 'notes',
    'Inspeccin': 'notes', 'Clnica': 'notes', 'Semiologa': 'notes',
    # Timeline
    'Timeline': 'timeline', 'timeline': 'timeline', 'Historial': 'timeline', 'Evolucin': 'timeline'
}

# Vazquez Tone Templates (Second Person Informal, Mordant)
VAZQUEZ_TEMPLATES = {
    'omission': [
        "¿De verdad vas a ignorar eso? Mi abuela diagnostica mejor que tú.",
        "Eso era una señal clara. Estás más perdido que un cirujano en una biblioteca.",
        "¿Omites el dato clave? Espero que tengas un buen abogado de negligencia.",
        "Claramente la medicina no es lo tuyo. Ese dato era VITAL."
    ],
    'hoarding': [
        "¿Para qué quieres eso? Estás coleccionando basura en lugar de salvar vidas.",
        "Felicidades, encontraste un dato irrelevante. Lástima que el paciente sigue enfermo.",
        "¿Síndrome de Diógenes clínico? Suelta eso, es puro ruido.",
        "Perdiendo el tiempo con tonterías... concéntrate en lo que importa."
    ],
    'lethal_hazard': [
        "¡ASESINO! Eso era un riesgo letal y lo dejaste pasar como si nada.",
        "Acabas de matar al paciente. ¿Contento? Lee un libro antes de volver a tocar a alguien.",
        "Eso fue un error mortal. Literalmente. El paciente ya está en el otro mundo.",
        "¡PELIGRO! Eso era una contraindicación absoluta. Menos mal que esto es un juego."
    ]
}

def get_vazquez_comment(error_type):
    import random
    templates = VAZQUEZ_TEMPLATES.get(error_type, VAZQUEZ_TEMPLATES['hoarding'])
    return random.choice(templates)

def normalize_case(data):
    modified = False
    
    # 1. Version
    if data.get("version") != "v3_swipe_action":
        data["version"] = "v3_swipe_action"
        modified = True
        
    # 2. Card Stream
    cards = data.get("card_stream", [])
    for card in cards:
        # Category Normalization
        old_cat = card.get("category")
        new_cat = CATEGORY_MAP.get(old_cat, old_cat)
        # If not in standard list, try to guess or keep as is if it seems clinical enough
        if new_cat not in ['vitals', 'labs', 'imaging', 'meds', 'notes', 'timeline']:
            # Default to 'notes' or 'labs' based on keywords
            text = card.get("card_text", "").lower()
            if any(k in text for k in ['mg/dl', 'mmol', 'hb', 'leucos', 'glucosa']):
                new_cat = 'labs'
            elif any(k in text for k in ['ta:', 'fc:', 'fr:', 'temp:', 'sat:']):
                new_cat = 'vitals'
            elif any(k in text for k in ['tac', 'usg', 'rx', 'imagen']):
                new_cat = 'imaging'
            elif any(k in text for k in ['mg/', 'iv', 'vo', 'administrar']):
                new_cat = 'meds'
                
        if old_cat != new_cat:
            card["category"] = new_cat
            modified = True
            
        # Scoring & Error Consistency
        scoring = card.get("scoring", {})
        action = card.get("expected_action")
        error_type = scoring.get("error_type")
        
        # Align error_type with action if generic
        if action == "keep" and error_type in ["hoarding", "none", None]:
            scoring["error_type"] = "omission"
            modified = True
        elif action == "discard" and error_type in ["omission", "none", None]:
            scoring["error_type"] = "hoarding"
            modified = True
            
        # Vazquez Personality check
        comment = scoring.get("vazquez_comment", "")
        if not comment or len(comment) < 15 or "placeholder" in comment.lower() or "vázquez" in comment.lower():
             scoring["vazquez_comment"] = get_vazquez_comment(scoring.get("error_type", "hoarding"))
             modified = True
             
    # 3. Pearl
    pearl = data.get("enarm_pearl") or data.get("perla_enarm")
    if pearl:
        if not pearl.get("title") and pearl.get("summary"):
            pearl["title"] = pearl["summary"][:50]
            modified = True
        if not pearl.get("text") and pearl.get("summary"):
            pearl["text"] = pearl["summary"]
            modified = True
            
    return modified, data

def main():
    cases_dir = "c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases"
    fixed = 0
    total = 0
    
    for filename in os.listdir(cases_dir):
        if not filename.startswith("CASE_") or not filename.endswith(".json"):
            continue
            
        total += 1
        filepath = os.path.join(cases_dir, filename)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            modified, new_data = normalize_case(data)
            
            if modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(new_data, f, indent=2, ensure_ascii=False)
                fixed += 1
                
        except Exception as e:
            print(f"Error processing {filename}: {e}")
            
    print(f"Technical Normalization complete. Fixed {fixed}/{total} cases.")

if __name__ == "__main__":
    main()
