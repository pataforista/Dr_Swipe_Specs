import json
import os
from pathlib import Path

# Paths
BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")
RESULTS_FILE = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/audit_results.json")

# Constants from User's Prompt
REQUIRED_VERSION = "v3_swipe_action"
MIN_CARDS = 10
MAX_CARDS = 15
MIN_CATEGORIES = 4
REQUIRED_CATEGORIES = {"vitals", "labs", "imaging", "meds", "notes", "timeline"}

def audit_case(filename, data):
    report = {
        "filename": filename,
        "case_id": data.get("case_id", "MISSING"),
        "errors": [],
        "warnings": [],
        "stats": {
            "card_count": 0,
            "category_count": 0,
            "categories": [],
            "vazquez_coverage": 0
        }
    }

    # 1. Version Check
    if data.get("version") != REQUIRED_VERSION:
        report["errors"].append(f"Invalid version: {data.get('version')} (Expected {REQUIRED_VERSION})")

    # 2. Card Stream Audit
    cards = data.get("card_stream", [])
    report["stats"]["card_count"] = len(cards)
    
    if len(cards) < MIN_CARDS:
        report["errors"].append(f"Too few cards: {len(cards)} (Min {MIN_CARDS})")
    elif len(cards) > MAX_CARDS:
        report["warnings"].append(f"Too many cards: {len(cards)} (Max {MAX_CARDS})")

    categories = set()
    vazquez_comments = 0
    
    for idx, card in enumerate(cards):
        cat = card.get("category")
        if cat: categories.add(cat)
        
        # Vazquez check
        scoring = card.get("scoring", {})
        comment = scoring.get("vazquez_comment", "")
        if comment and len(comment) > 10 and "placeholder" not in comment.lower():
            vazquez_comments += 1
        
        # Action vs Error check
        action = card.get("expected_action")
        error_type = scoring.get("error_type")
        if action == "keep" and error_type not in ["omission", "lethal_omission", "none"]:
            report["warnings"].append(f"Card {idx}: Action 'keep' with error_type '{error_type}' (Expected 'omission')")
        if action == "discard" and error_type not in ["hoarding", "lethal_hazard", "lethal_commission", "none"]:
            report["warnings"].append(f"Card {idx}: Action 'discard' with error_type '{error_type}' (Expected 'hoarding' or 'lethal')")

    report["stats"]["category_count"] = len(categories)
    report["stats"]["categories"] = list(categories)
    report["stats"]["vazquez_coverage"] = vazquez_comments / len(cards) if cards else 0

    if len(categories) < MIN_CATEGORIES:
        report["errors"].append(f"Insufficient categories: {len(categories)} (Min {MIN_CATEGORIES})")
    
    # 3. Boss Fight check
    boss = data.get("boss_fight_triad")
    if boss:
        qs = boss.get("questions", [])
        if len(qs) != 3:
            report["errors"].append(f"Boss Fight Triad has {len(qs)} questions (Expected 3)")

    # 4. Enarm Pearl check
    pearl = data.get("enarm_pearl") or data.get("perla_enarm")
    if not pearl:
        report["errors"].append("Missing Enarm Pearl")
    else:
        text = pearl.get("text", "") or pearl.get("summary", "")
        if "placeholder" in text.lower() or len(text) < 20:
             report["warnings"].append("Enarm Pearl looks like a placeholder")

    return report

def main():
    if not BASE_DIR.exists():
        print(f"Error: {BASE_DIR} not found")
        return

    all_results = []
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    
    print(f"Auditing {len(case_files)} cases...")
    
    for f in case_files:
        try:
            with open(f, 'r', encoding='utf-8') as file:
                data = json.load(file)
            result = audit_case(f.name, data)
            all_results.append(result)
        except Exception as e:
            all_results.append({"filename": f.name, "errors": [f"Failed to parse JSON: {str(e)}"]})

    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    
    print(f"Audit complete. Results saved to {RESULTS_FILE}")

    # Summary Stats
    errors = [r for r in all_results if r.get("errors")]
    warnings = [r for r in all_results if r.get("warnings") and not r.get("errors")]
    clean = [r for r in all_results if not r.get("errors") and not r.get("warnings")]
    
    print(f"\nSummary:")
    print(f"  Clean: {len(clean)}")
    print(f"  With Warnings: {len(warnings)}")
    print(f"  With Errors: {len(errors)}")

if __name__ == "__main__":
    main()
