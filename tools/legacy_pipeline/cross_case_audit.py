import json
import os
from pathlib import Path
from collections import Counter, defaultdict

BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")
REPORT_FILE = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/cross_case_audit.json")

def main():
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    all_questions = defaultdict(list)
    
    for f_path in case_files:
        try:
            with open(f_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            questions = data.get("boss_fight_triad", {}).get("questions", [])
            for q in questions:
                q_text = q.get("question", "").strip()
                if q_text:
                    all_questions[q_text].append(f_path.name)
        except:
            continue
            
    # Filter for questions that appear in more than 1 case
    duped_across = {q: files for q, files in all_questions.items() if len(files) > 1}
    
    # Sort by frequency
    sorted_duped = sorted(duped_across.items(), key=lambda x: len(x[1]), reverse=True)
    
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        json.dump(sorted_duped, f, indent=2, ensure_ascii=False)
        
    print(f"Audit complete. Found {len(sorted_duped)} questions duplicated across cases.")

if __name__ == "__main__":
    main()
