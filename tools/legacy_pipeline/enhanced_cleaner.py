import json
import os
import re
from pathlib import Path

# Paths
BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")
RESULTS_FILE = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/cleaning_audit_results.json")

# Prefixes to strip (they will be re-added or managed by the engine formatter)
STRIP_PREFIXES = [
    r'🎯\s*DATO\s*CLAVE\s*OMITIDO:\s*',
    r'🚨\s*ERROR\s*CRÍTICO!?:\s*',
    r'🧹\s*DESCARTE\s*RECOMENDADO:\s*',
    r'✓\s*CORRECTO:\s*',
]

def clean_comment(comment):
    if not comment: return comment
    new_comment = comment
    for pattern in STRIP_PREFIXES:
        new_comment = re.sub(pattern, "", new_comment, flags=re.IGNORECASE)
    return new_comment.strip()

def fix_card(card):
    modified = False
    action = card.get("expected_action")
    scoring = card.get("scoring", {})
    comment = scoring.get("vazquez_comment", "")
    
    if not comment: return False
    
    # 1. Clean hardcoded engine-style prefixes
    new_comment = clean_comment(comment)
    
    # 2. Fix specific concordance issues
    # If discard, should not start with "Match", "Exacto", etc.
    # We do this after cleaning prefixes.
    
    # Split speaker if exists
    speaker = ""
    reasoning = new_comment
    if ":" in new_comment[:20]:
        parts = new_comment.split(":", 1)
        speaker = parts[0] + ":"
        reasoning = parts[1].strip()
        
    pos_markers = [
        (r'^¡?Match!?\s*', "Bien detectado: "),
        (r'^¡?Excelentes!?\s*', "Bien detectado: "),
        (r'^¡?Perfecto!?\s*', "Bien detectado: "),
        (r'^¡?Logrado!?\s*', "Bien detectado: "),
    ]
    
    if action == "discard":
        for pattern, replacement in pos_markers:
            if re.match(pattern, reasoning, re.IGNORECASE):
                reasoning = re.sub(pattern, replacement, reasoning, flags=re.IGNORECASE)
                modified = True
                break
                
    if modified or new_comment != comment:
        final_comment = f"{speaker} {reasoning}".strip()
        card["scoring"]["vazquez_comment"] = final_comment
        return True
        
    return False

def main():
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    fixed_count = 0
    
    for f_path in case_files:
        try:
            with open(f_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            case_modified = False
            for card in data.get("card_stream", []):
                if fix_card(card):
                    case_modified = True
            
            if case_modified:
                with open(f_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                fixed_count += 1
        except Exception as e:
            print(f"Error {f_path.name}: {e}")
            
    print(f"Cleaned and fixed {fixed_count} files.")

if __name__ == "__main__":
    main()
