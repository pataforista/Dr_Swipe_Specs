import json
import os
import glob

base_dir = "c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs"
cases_dirs = [
    base_dir + "/cases",
    base_dir + "/dr-swipe/public/cases"
]

def adjust_case(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        return False
    
    if not isinstance(data, dict):
        return False # Ignore index files or lists
        
    difficulty = data.get("difficulty", "standard").lower()
    intro = data.get("patient_intro", {})
    if not intro: return False
    
    current_time = intro.get("time_limit_sec", 60)
    
    modified = False
    # Standard: 60s
    if difficulty == "standard" and current_time < 60:
        data["patient_intro"]["time_limit_sec"] = 60
        modified = True
    # Hard: 50s (was 45s)
    elif difficulty == "hard" and current_time < 50:
        data["patient_intro"]["time_limit_sec"] = 50
        modified = True
    # Easy: 90s
    elif difficulty == "easy" and current_time < 90:
        data["patient_intro"]["time_limit_sec"] = 90
        modified = True
        
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    return modified

count = 0
for d in cases_dirs:
    for f in glob.glob(d + "/*.json"):
        if adjust_case(f):
            count += 1

print(f"Adjusted timing for {count} cases.")
