import json
import os
from pathlib import Path

BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")

def fix_logic(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except: return False
            
    if not isinstance(data, dict):
        return False
        
    modified = False
    for card in data.get("card_stream", []):
        action = card.get("expected_action")
        scoring = card.get("scoring", {})
        error_type = scoring.get("error_type")
        
        # Logic: 
        # Discard -> should be hoarding (or hazard)
        # Keep -> should be omission (or lethal_omission)
        
        if action == "discard" and error_type == "omission":
            scoring["error_type"] = "hoarding"
            modified = True
        elif action == "keep" and error_type == "hoarding":
            scoring["error_type"] = "omission"
            modified = True
            
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return True
    return False

def main():
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    fixed_count = 0
    for f_path in case_files:
        if fix_logic(f_path):
            fixed_count += 1
    print(f"Fixed logic discrepancies in {fixed_count} files.")

if __name__ == "__main__":
    main()
