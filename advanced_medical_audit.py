import json
import os
import re
from pathlib import Path

# Paths
BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")
RESULTS_FILE = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/advanced_audit_results.json")

# Positive praise that should NOT be in a discard comment (as a lead-in)
# Note: "Bien" can be used for "Bien, lo descartaste", but "¡Match!" usually means "selected".
# Actually, the formatter prepends "Correcto." if isCorrect. 
# So the original comment shouldn't have redundant or contradictory praise.
SUSPICIOUS_POSITIVE = ["¡match!", "¡perfecto!", "¡excelente!", "¡logrado!", "¡exacto!", "¡muy bien!"]

def audit_case(filename, data):
    intro = data.get("patient_intro", {}).get("arrival_scenario", "")
    cards = data.get("card_stream", [])
    issues = []
    
    for idx, card in enumerate(cards):
        action = card.get("expected_action")
        comment = card.get("scoring", {}).get("vazquez_comment", "").lower()
        text = card.get("card_text", "").lower()
        
        # 1. Concordance check: Positive lead-in for a discard action
        if action == "discard":
            for marker in SUSPICIOUS_POSITIVE:
                if marker in comment[:30]: # Look at start of comment
                    issues.append({
                        "card_index": idx,
                        "type": "CONCORDANCE_WARNING",
                        "detail": f"Discard action with positive marker '{marker}' in comment: '{card['scoring']['vazquez_comment']}'"
                    })
        
        # 2. Category mismatch (Vitals)
        if card.get("category") == "vitals":
            # If vitals don't contain numbers or typical vital signs
            vitals_keywords = ["ta", "fc", "fr", "temp", "so2", "sat", "gluco", "peso", "talla"]
            if not any(k in text for k in vitals_keywords) and not any(k in comment for k in vitals_keywords):
                issues.append({
                    "card_index": idx,
                    "type": "CATEGORY_MISMATCH",
                    "detail": f"Category 'vitals' but text/comment lacks vital signs: '{card['card_text']}'"
                })
                
        # 3. Clinical logic (basic)
        # Check for PH values if mentioned in both intro and card
        ph_match_intro = re.search(r'ph\s+(?:vaginal\s+)?(?:de\s+)?(\d+\.?\d*)', intro.lower())
        if ph_match_intro:
            intro_ph = float(ph_match_intro.group(1))
            card_ph_req = re.search(r'ph\s+([<>])\s*(\d+\.?\d*)', text)
            if card_ph_req:
                op = card_ph_req.group(1)
                val = float(card_ph_req.group(2))
                is_met = (op == '<' and intro_ph < val) or (op == '>' and intro_ph > val)
                if is_met and action == "discard":
                    issues.append({
                        "card_index": idx,
                        "type": "CLINICAL_SENSE_WARNING",
                        "detail": f"Patient PH {intro_ph} meets condition '{op}{val}' but card is 'discard'"
                    })
                elif not is_met and action == "keep":
                    issues.append({
                        "card_index": idx,
                        "type": "CLINICAL_SENSE_WARNING",
                        "detail": f"Patient PH {intro_ph} does NOT meet condition '{op}{val}' but card is 'keep'"
                    })

    return issues

def main():
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    all_reports = []
    
    print(f"Auditing {len(case_files)} cases...")
    for f in case_files:
        try:
            with open(f, 'r', encoding='utf-8') as file:
                data = json.load(file)
            report = audit_case(f.name, data)
            if report:
                all_reports.append({
                    "filename": f.name,
                    "issues": report
                })
        except Exception as e:
            print(f"Error {f.name}: {e}")
            
    with open(RESULTS_FILE, 'w', encoding='utf-8') as f_out:
        json.dump(all_reports, f_out, indent=2, ensure_ascii=False)
    
    print(f"Done. Found issues in {len(all_reports)} cases.")

if __name__ == "__main__":
    main()
