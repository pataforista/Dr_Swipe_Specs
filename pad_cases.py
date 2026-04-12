import json
import os
import random

LIBRARIES = {
    'PED': {
        'keep': [
            {"icon": "🩺", "cat": "vitals", "text": "FR: 45 rpm. Polipnea leve a moderada en reposo.", "points": 50, "err": "omission"},
            {"icon": "🩸", "cat": "labs", "text": "Leucocitosis de 15,000 con neutrofilia del 80%.", "points": 50, "err": "omission"},
            {"icon": "👶", "cat": "notes", "text": "Llenado capilar de 2 segundos, mucosas hidratadas.", "points": 50, "err": "omission"},
            {"icon": "☢️", "cat": "imaging", "text": "Rx Torax: Se observa infiltrado parahiliar bilateral.", "points": 50, "err": "omission"},
            {"icon": "💊", "cat": "meds", "text": "Paracetamol 15mg/kg/dosis administrado por fiebre.", "points": 50, "err": "omission"}
        ],
        'discard': [
            {"icon": "📄", "cat": "notes", "text": "Refiere la madre que el niño no durmió bien hace 3 días por ruido externo.", "points": 50, "err": "hoarding"},
            {"icon": "🧪", "cat": "labs", "text": "Examen general de orina: pH 6.0, densidad 1.015, sin nitritos.", "points": 50, "err": "hoarding"},
            {"icon": "👶", "cat": "notes", "text": "Hermanito de 2 años con esquema de vacunación completo reported by mother.", "points": 50, "err": "hoarding"}
        ]
    },
    'SURG': {
        'keep': [
            {"icon": "🩺", "cat": "vitals", "text": "Rebote (+) en fosa ilíaca derecha. Signo de McBurney positivo.", "points": 100, "err": "omission"},
            {"icon": "🩸", "cat": "labs", "text": "PCR 45 mg/L (elevado). Sugiere proceso inflamatorio agudo.", "points": 50, "err": "omission"},
            {"icon": "☢️", "cat": "imaging", "text": "Niveles hidroaéreos en radiografía simple de abdomen de pie.", "points": 50, "err": "omission"},
            {"icon": "💊", "cat": "meds", "text": "Se administra profilaxis antibiótica preoperatoria (Cefalotina).", "points": 50, "err": "omission"}
        ],
        'discard': [
            {"icon": "📄", "cat": "notes", "text": "Antecedente de cirugía de túnel carpiano hace 5 años sin complicaciones.", "points": 50, "err": "hoarding"},
            {"icon": "🧪", "cat": "labs", "text": "Glucosa capilar 95 mg/dL en ayuno de 4 horas.", "points": 50, "err": "hoarding"},
            {"icon": "📄", "cat": "notes", "text": "Paciente refiere que el dolor 'se siente diferente' a cuando tuvo gastritis.", "points": 50, "err": "hoarding"}
        ]
    },
    'OBG': {
        'keep': [
            {"icon": "🩺", "cat": "vitals", "text": "TA 145/95 mmHg. Cifras tensionales elevadas en dos tomas.", "points": 50, "err": "omission"},
            {"icon": "🤰", "cat": "notes", "text": "Altura uterina de 28 cm, acorde a edad gestacional por FUM.", "points": 50, "err": "omission"},
            {"icon": "🩸", "cat": "labs", "text": "Proteinuria en tira reactiva (++) en muestra al azar.", "points": 50, "err": "omission"},
            {"icon": "☢️", "cat": "imaging", "text": "Ultrasonido transvaginal reporta saco gestacional normoinserto.", "points": 50, "err": "omission"}
        ],
        'discard': [
            {"icon": "📄", "cat": "notes", "text": "Refiere consumo de ácido fólico antes de la concepción de forma irregular.", "points": 50, "err": "hoarding"},
            {"icon": "🤰", "cat": "notes", "text": "Movimientos fetales percibidos por la madre como 'normales' hoy.", "points": 50, "err": "hoarding"},
            {"icon": "🩸", "cat": "labs", "text": "VDRL no reactivo (reporte de hace 2 meses).", "points": 50, "err": "hoarding"}
        ]
    },
    'INT': {
        'keep': [
            {"icon": "🩺", "cat": "vitals", "text": "FC 105 lpm. Taquicardia sinusal persistente en reposo.", "points": 50, "err": "omission"},
            {"icon": "🧪", "cat": "labs", "text": "Creatinina 1.6 mg/dL. Elevación respecto a basal previa.", "points": 50, "err": "omission"},
            {"icon": "📄", "cat": "notes", "text": "Edema de miembros inferiores grado II, con fóvea, bilateral.", "points": 50, "err": "omission"},
            {"icon": "☢️", "cat": "imaging", "text": "Rx Torax: Se observa discreto derrame pleural derecho.", "points": 50, "err": "omission"},
            {"icon": "💊", "cat": "meds", "text": "Ajuste de dosis de metformina por falla renal aguda detectada.", "points": 50, "err": "omission"}
        ],
        'discard': [
            {"icon": "📄", "cat": "notes", "text": "Refiere alergia al polen y al polvo durante la primavera.", "points": 50, "err": "hoarding"},
            {"icon": "🧪", "cat": "labs", "text": "Colesterol Total 190 mg/dL. Dentro de rangos convencionales.", "points": 50, "err": "hoarding"},
            {"icon": "☢️", "cat": "imaging", "text": "Rx Torax: Botón aórtico prominente acorde a la edad del paciente.", "points": 50, "err": "hoarding"}
        ]
    }
}

DEFAULT_LIB = LIBRARIES['INT']

VAZQUEZ_TEMPLATES = {
    'omission': [
        "¿De verdad vas a ignorar eso? Mi abuela diagnostica mejor que tú.",
        "Eso era una señal clara. Estás más perdido que un cirujano en una biblioteca.",
        "¿Omites el dato clave? Espero que tengas un buen abogado de negligencia."
    ],
    'hoarding': [
        "¿Para qué quieres eso? Estás coleccionando basura en lugar de salvar vidas.",
        "Felicidades, encontraste un dato irrelevante. Lástima que el paciente sigue enfermo.",
        "¿Síndrome de Diógenes clínico? Suelta eso, es puro ruido."
    ]
}

def get_vazquez(err):
    return random.choice(VAZQUEZ_TEMPLATES.get(err, VAZQUEZ_TEMPLATES['hoarding']))

def detect_domain(filename):
    if 'PED' in filename: return 'PED'
    if 'SURG' in filename: return 'SURG'
    if any(x in filename for x in ['OBS', 'OBG', 'GYN']): return 'OBG'
    return 'INT'

def pad_case(data, domain):
    cards = data.get("card_stream", [])
    current_categories = set(c.get("category") for c in cards)
    
    modified = False
    
    # Check if we need to reach 10 cards OR diversity
    if len(cards) < 10 or len(current_categories) < 4:
        lib = LIBRARIES.get(domain, DEFAULT_LIB)
        
        # Add cards until 10 AND 4 categories
        count_added = 0
        while len(cards) < 10 or (len(current_categories) < 4 and count_added < 5):
            # Pick a category we DON'T have yet if possible
            missing = [item for pool in [lib['keep'], lib['discard']] for item in pool if item['cat'] not in current_categories]
            
            if missing:
                template = random.choice(missing)
            else:
                pool = lib['keep'] if count_added % 2 == 0 else lib['discard']
                template = random.choice(pool)
            
            action = "keep" if template in lib['keep'] else "discard"
            
            new_card = {
                "card_id": f"pad_{len(cards)+1:03d}_{random.randint(100,999)}",
                "ui_icon": template['icon'],
                "category": template['cat'],
                "card_text": template['text'],
                "expected_action": action,
                "scoring": {
                    "points": template['points'],
                    "error_type": template['err'],
                    "vazquez_comment": get_vazquez(template['err'])
                }
            }
            cards.append(new_card)
            current_categories.add(template['cat'])
            count_added += 1
            modified = True
    
    if modified:
        data["card_stream"] = cards
    return modified, data

def main():
    cases_dir = "c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases"
    padded = 0
    
    for filename in os.listdir(cases_dir):
        if not filename.startswith("CASE_") or not filename.endswith(".json"):
            continue
            
        filepath = os.path.join(cases_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            domain = detect_domain(filename)
            modified, new_data = pad_case(data, domain)
            
            if modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(new_data, f, indent=2, ensure_ascii=False)
                padded += 1
        except Exception as e:
            print(f"Error in {filename}: {e}")
            
    print(f"Padding complete. Modified {padded} cases.")

if __name__ == "__main__":
    main()
