import json
import os
import re
from pathlib import Path

# Paths
BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")
RESULTS_FILE = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/concordance_audit_results.json")

def check_concordance(card, patient_intro):
    action = card.get("expected_action")
    comment = card.get("scoring", {}).get("vazquez_comment", "").lower()
    text = card.get("card_text", "").lower()
    
    issues = []
    
    # Positive markers that usually imply "This item belongs to this patient"
    positive_markers = ["match", "correcto", "excelente", "muy bien", "exacto", "así es", "así se hace"]
    
    # 1. Action vs Comment Concordance
    if action == "discard":
        # If we discard, the comment shouldn't sound like we are confirming a positive find for the patient
        # UNLESS it's clarifying why it was correct to discard.
        if "match" in comment:
            issues.append(f"Action 'discard' with 'match' in comment: '{card.get('scoring', {}).get('vazquez_comment')}'")
            
    # 2. Clinical sense (Heuristic/Keyword based)
    # If the card text mentions a PH or value that contradicts the patient_intro
    # This is harder to automate perfectly but we can flag common ones.
    
    return issues

def audit_all_cases():
    all_issues = []
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    
    for f in case_files:
        try:
            with open(f, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            case_id = data.get("case_id")
            intro = data.get("patient_intro", {}).get("arrival_scenario", "")
            
            case_report = {
                "filename": f.name,
                "case_id": case_id,
                "cards_with_issues": []
            }
            
            for idx, card in enumerate(data.get("card_stream", [])):
                card_issues = check_concordance(card, intro)
                if card_issues:
                    case_report["cards_with_issues"].append({
                        "card_index": idx,
                        "card_id": card.get("card_id"),
                        "text": card.get("card_text"),
                        "action": card.get("expected_action"),
                        "comment": card.get("scoring", {}).get("vazquez_comment"),
                        "issues": card_issues
                    })
            
            if case_report["cards_with_issues"]:
                all_issues.append(case_report)
                
        except Exception as e:
            print(f"Error processing {f.name}: {e}")

    with open(RESULTS_FILE, 'w', encoding='utf-8') as f_out:
        json.dump(all_issues, f_out, indent=2, ensure_ascii=False)
    
    return all_issues

if __name__ == "__main__":
    issues = audit_all_cases()
    print(f"Found issues in {len(issues)} cases.")
