import json
import os
import random
from pathlib import Path

BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")

def clinicalize_stats(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except: return False
            
    if "STATS" not in file_path.name:
        return False
        
    modified = False
    
    # 1. Humanize Intro
    intro = data.get("patient_intro", {})
    name = intro.get("name", "El paciente")
    scenario = intro.get("arrival_scenario", "")
    
    # Check if it looks purely theoretical
    if "Sensibilidad" in scenario and "Marta" in name:
        # Extract metrics if possible
        sn_match = "90%" # Default
        sp_match = "90%"
        
        # Simple clinicalization of the scenario
        new_scenario = (
            f"Te encuentras en la consulta con {name}. Has solicitado una prueba diagnóstica para confirmar tu sospecha. "
            f"La literatura reporta que esta prueba tiene una Sensibilidad del {sn_match} y una Especificidad del {sp_match}. "
            f"El resultado vuelve POSITIVO. Navarro se acerca y te pregunta: "
            f"¿Cuál es la probabilidad real de que {name} tenga la enfermedad (VPP) considerando la prevalencia actual?"
        )
        intro["arrival_scenario"] = new_scenario
        modified = True
        
    # 2. Fix Vitals
    for card in data.get("card_stream", []):
        text = card.get("card_text", "")
        if "TA N/Á" in text or "N/Á" in text:
            card["card_text"] = "TA 120/80 mmHg, FC 75 lpm, Temp 36.6°C. El paciente se encuentra hemodinámicamente estable."
            card["category"] = "vitals"
            card["ui_icon"] = "heartbeat"
            
            # Update Navarro's comment for vitals
            card["scoring"]["vazquez_comment"] = "Navarro: ¡Bien! Antes de lanzarnos a los números, siempre verificamos que el paciente esté estable. Ahora, volvamos a la estadística."
            modified = True
            
        # 3. Enhance Navarro's expert tone
        comment = card.get("scoring", {}).get("vazquez_comment", "")
        if "Navarro:" in comment and len(comment) < 100:
            if "Sensibilidad" in comment:
                card["scoring"]["vazquez_comment"] += " Recuerda: es la métrica de 'oro' para no dejar escapar a ningún enfermo en el tamizaje."
                modified = True
            elif "Especificidad" in comment:
                card["scoring"]["vazquez_comment"] += " Es el poder de 'confirmación'. Si es positiva, casi puedes apostar a que el diagnóstico es correcto."
                modified = True
                
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return True
    return False

def main():
    case_files = [f for f in BASE_DIR.glob("CASE_PROC_STATS*.json")]
    count = 0
    for f_path in case_files:
        if clinicalize_stats(f_path):
            count += 1
    print(f"Clinicalized {count} statistics cases.")

if __name__ == "__main__":
    main()
