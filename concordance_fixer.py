import json
import os
import re
from pathlib import Path

# Paths
BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")
LOG_FILE = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/automated_fixes_log.json")

# Praise that implies KEEPing but found in DISCARD
# We search after the prefix "Speaker: "
MISMATCHED_PRAISE = [
    (r'(¡?Match!?\s*)', "Bien detectado: "),
    (r'(¡?Perfecto!?\s*)', "Bien detectado: "),
    (r'(¡?Exacto!?\s*)', "Bien detectado: "),
    (r'(¡?Logrado!?\s*)', "Bien detectado: "),
]

def fix_card(card):
    modified = False
    action = card.get("expected_action")
    comment = card.get("scoring", {}).get("vazquez_comment", "")
    
    if action == "discard" and comment:
        # Split prefix if exists
        prefix = ""
        rest = comment
        if ":" in comment[:20]: # Heuristic for speaker: prefix
            parts = comment.split(":", 1)
            prefix = parts[0] + ":"
            rest = parts[1].strip()
        
        for pattern, replacement in MISMATCHED_PRAISE:
            # We only match if it's at the BEGINNING of the rest (ignoring spaces)
            match_pattern = "^" + pattern
            if re.match(match_pattern, rest, re.IGNORECASE):
                new_rest = re.sub(match_pattern, replacement, rest, flags=re.IGNORECASE)
                card["scoring"]["vazquez_comment"] = f"{prefix} {new_rest}".strip()
                modified = True
                break
                
    return modified

def process_cases():
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    fixes = []
    
    for f_path in case_files:
        try:
            with open(f_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            case_modified = False
            case_fixes = []
            
            for idx, card in enumerate(data.get("card_stream", [])):
                old_comment = card.get("scoring", {}).get("vazquez_comment", "")
                if fix_card(card):
                    case_modified = True
                    case_fixes.append({
                        "card_index": idx,
                        "old": old_comment,
                        "new": card["scoring"]["vazquez_comment"]
                    })
            
            if case_modified:
                with open(f_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                fixes.append({
                    "filename": f_path.name,
                    "fixes": case_fixes
                })
        except Exception as e:
            print(f"Error in {f_path.name}: {e}")
            
    with open(LOG_FILE, 'w', encoding='utf-8') as f_log:
        json.dump(fixes, f_log, indent=2, ensure_ascii=False)
    
    return len(fixes)

if __name__ == "__main__":
    count = process_cases()
    print(f"Fixed {count} files.")
