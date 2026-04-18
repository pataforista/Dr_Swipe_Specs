import json
import os
import re
from pathlib import Path

BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")

# Mapping of short/poor comments to better ones
REDACTION_MAP = {
    "Bien.": "¡Buen trabajo! Continúa con la valoración clínica del paciente.",
    "Correcto.": "Correcto. Este hallazgo es fundamental para el razonamiento médico en este caso.",
    "Buen trabajo.": "¡Excelente! Mantén el enfoque en los datos clave de la guía de práctica clínica.",
    "Sigue así.": "¡Bien! Estás integrando correctamente los elementos diagnósticos.",
    "¡Match!": "¡Correcto! Este dato confirma tu sospecha diagnóstica inicial.",
    "¡Perfecto!": "¡Perfecto! Estás siguiendo el algoritmo de manejo de manera impecable.",
    "Felicidades.": "¡Bien! Has identificado un punto crítico en el manejo del paciente.",
    "Buen diagnóstico.": "Excelente razonamiento. El diagnóstico preciso es la base del éxito terapéutico.",
    "Mi abuela diagnostica mejor que tú.": "Mendoza: Este es un error de interpretación grave. Revisa la fisiopatología de inmediato.",
    "¿De verdad vas a ignorar eso?": "Cuidado. Ignorar este signo vital puede comprometer la seguridad del paciente.",
    "¿Síndrome de Diógenes clínico?": "Mendoza: Estás acumulando información irrelevante. En el ENARM, el tiempo es vital."
}

def clean_redaction(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except:
            return False
            
    if not isinstance(data, dict):
        return False
        
    modified = False
    for card in data.get("card_stream", []):
        comment = card.get("scoring", {}).get("vazquez_comment", "").strip()
        
        # Exact matching
        if comment in REDACTION_MAP:
            card["scoring"]["vazquez_comment"] = REDACTION_MAP[comment]
            modified = True
            
        # Regex matching for short comments like "Vazquez: Bien."
        elif len(comment) < 12 and any(start in comment for start in ["Bien", "Correcto", "Exacto"]):
             # Keep prefix if present
             prefix_match = re.match(r'^([^:]+:\s*)', comment)
             prefix = prefix_match.group(1) if prefix_match else ""
             base_comment = "Estás operando con agudeza clínica. Sigue el protocolo."
             card["scoring"]["vazquez_comment"] = f"{prefix}{base_comment}"
             modified = True
             
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return True
    return False

def main():
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    modified_count = 0
    
    for f_path in case_files:
        if clean_redaction(f_path):
            modified_count += 1
            
    print(f"Cleaned redaction in {modified_count} files.")

if __name__ == "__main__":
    main()
