import json
import os
import re
from pathlib import Path

# Paths
BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")

# Mapping of common mangled character sequences
ENCODING_MAP = {
    "A©": "é", "A¡": "á", "A­": "í", "A³": "ó", "Aº": "ú", "A±": "ñ", "A‘": "Ñ", "A¿": "¿", "A°": "°",
    "ðYZ¯": "🎯", "ðYZ¡": "🚨", "ðYZ ": "🚨", "â‰¥": "≥", "â‰¤": "≤"
}

# Specific word artifacts
WORD_FIXES = {
    "Á)": "A)", "B)": "B)", "C)": "C)", "D)": "D)", "E)": "E)", "F)": "F)", "G)": "G)", "H)": "H)", "I)": "I)", "J)": "J)",
    "4Áª": "4ª", "3Áª": "3ª", "2Áª": "2ª", "1Áª": "1ª",
    "Áƒánica": "única", "áFalso!": "¡Falso!", "áBien!": "¡Bien!", "áCorrecto!": "¡Correcto!",
    "á¡": "¡", "á¿": "¿"
}

def fix_content(content):
    new_content = content
    for junk, good in ENCODING_MAP.items():
        new_content = new_content.replace(junk, good)
    for junk, good in WORD_FIXES.items():
        new_content = new_content.replace(junk, good)
    
    # regex for Á followed by lowercase or space
    new_content = re.sub(r'Á([a-z\s\)])', r'A\1', new_content)
    # regex for any remaining Á in ENARM
    new_content = new_content.replace("ENÁRM", "ENARM")
    new_content = new_content.replace("DÁTO", "DATO")
    new_content = new_content.replace("CLÁVE", "CLAVE")
    new_content = new_content.replace("OMITIDO", "OMITIDO")
    
    return new_content

def process_cases():
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    fixed_count = 0
    for f_path in case_files:
        try:
            with open(f_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            new_content = fix_content(content)
            if new_content != content:
                json.loads(new_content)
                with open(f_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                fixed_count += 1
        except: pass
    print(f"Final polish encoding in {fixed_count} files.")

if __name__ == "__main__": process_cases()
