import json
import os
from pathlib import Path
from collections import Counter

BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")
REPORT_FILE = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/quality_audit_report.json")

def audit_case(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except:
            return None
            
    if not isinstance(data, dict):
        return None
            
    issues = []
    
    # Check for duplicate cards
    card_texts = [card.get("card_text", "").strip() for card in data.get("card_stream", [])]
    text_counts = Counter(card_texts)
    dup_cards = [text for text, count in text_counts.items() if count > 1 and text]
    if dup_cards:
        issues.append({
            "type": "DUPLICATE_CARDS",
            "details": dup_cards
        })
        
    # Check for duplicate questions in boss fight
    questions = data.get("boss_fight_triad", {}).get("questions", [])
    if isinstance(questions, list):
        q_texts = [q.get("question", "").strip() for q in questions]
        q_counts = Counter(q_texts)
        dup_qs = [q for q, count in q_counts.items() if count > 1 and q]
        if dup_qs:
            issues.append({
                "type": "DUPLICATE_QUESTIONS",
                "details": dup_qs
            })
        
    # Check for order (Vitals should be early)
    card_ids = [card.get("card_id", "") for card in data.get("card_stream", [])]
    if "init_vitals" in card_ids:
        vitals_idx = card_ids.index("init_vitals")
        if vitals_idx > 2:
            issues.append({
                "type": "FLOW_WARNING",
                "details": f"init_vitals at index {vitals_idx} (late)"
            })
            
    # Check for poor redaction
    for i, card in enumerate(data.get("card_stream", [])):
        comment = card.get("scoring", {}).get("vazquez_comment", "")
        # Filter out very short or clearly placeholder comments
        if comment and len(comment.strip()) < 12:
             issues.append({
                "type": "REDACTION_WARNING",
                "details": f"Short comment in card {i}: '{comment}'"
            })
            
    return issues if issues else None

def main():
    # Only audit files starting with CASE_
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    report = {}
    
    for f in case_files:
        res = audit_case(f)
        if res:
            report[f.name] = res
            
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        
    print(f"Audit complete. Found issues in {len(report)} files.")

if __name__ == "__main__":
    main()
