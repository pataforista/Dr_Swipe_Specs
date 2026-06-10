import json
import os
import random
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")

# Synonyms for question starts to vary redaction
QUESTION_STARTS = [
    "¿Cuál es", 
    "Identifique", 
    "Con respecto a la patología, ¿cuál es",
    "De las siguientes opciones, ¿cuál es",
    "En este contexto clínico, ¿cuál es"
]

def diversify_questions(questions):
    if not questions:
        return questions
        
    random.shuffle(questions)
    for q in questions:
        # Shuffle options
        options = q.get("options", [])
        if len(options) > 1:
            correct_opt = options[q.get("correct_index", 0)]
            random.shuffle(options)
            q["options"] = options
            q["correct_index"] = options.index(correct_opt)
            
        # Slight text variation for common starts
        text = q.get("question", "")
        if text.startswith("¿Cuál es"):
             if random.random() > 0.5:
                 new_start = random.choice(QUESTION_STARTS)
                 if not text.startswith(new_start):
                    q["question"] = text.replace("¿Cuál es", new_start)
                    
    return questions

def main():
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    
    # Group by prefix (e.g. CASE_PROC_OBS_HEMORRHAGE_DPPNI)
    groups = defaultdict(list)
    for f in case_files:
        # Get theme by stripping the version/index (last 2 parts)
        parts = f.name.split("_")
        if len(parts) > 4:
            theme = "_".join(parts[:-2])
            groups[theme].append(f)
            
    modified_count = 0
    
    for theme, files in groups.items():
        # For each case in the theme, diversify its boss fight
        for f_path in files:
            with open(f_path, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                except:
                    continue
            
            original_triad = data.get("boss_fight_triad", {})
            questions = original_triad.get("questions", [])
            
            if questions:
                new_qs = diversify_questions(questions)
                data["boss_fight_triad"]["questions"] = new_qs
                
                with open(f_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=4, ensure_ascii=False)
                modified_count += 1
                
    print(f"Diversified boss fights in {modified_count} files.")

if __name__ == "__main__":
    main()
