#!/usr/bin/env python3
"""Insert reviewed distractor (discard) cards from a drafts file into the corpus.

Drafts live in content_drafts/*.json, grouped by case family (case_id
without its trailing variant number). Every card in a family is inserted
into every case of that family, except cards marked "reserva": true. The
insertion position is random but seeded by case_id, so the result is
reproducible and the distractors do not cluster at the end of the deck.

Idempotent: a card whose card_id is already in the case is skipped.

Usage: python3 tools/insert_distractors.py <cases_dir> <drafts.json> [--check]
"""
import json
import random
import re
import sys
from pathlib import Path

MAX_CARDS = 18  # same limit as tools/validate_cases.py and caseSchema.ts


def build_card(draft: dict) -> dict:
    card = {
        "card_id": draft["card_id"],
        "ui_icon": draft["ui_icon"],
        "category": draft["category"],
        "card_text": draft["card_text"],
        "expected_action": "discard",
        "scoring": {
            "points": 150 if draft.get("lethal_risk") else 100,
            "error_type": "lethal_commission" if draft.get("lethal_risk") else "hoarding",
            "vazquez_comment": draft["comment"],
        },
    }
    if draft.get("lethal_risk"):
        card["safety_flags"] = {"lethal_risk": True}
    return card


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    cases_dir, drafts_path = Path(sys.argv[1]), Path(sys.argv[2])
    check = "--check" in sys.argv[3:]
    families = json.loads(drafts_path.read_text(encoding="utf-8"))["familias"]

    inserted = files = 0
    errors = []
    summary = []
    for family, drafts in families.items():
        active = [d for d in drafts if not d.get("reserva")]
        paths = sorted(cases_dir.glob(f"CASE_{family}_*.json"))
        if not paths:
            errors.append(f"{family}: no hay casos")
            continue
        keep = discard = 0
        for path in paths:
            case = json.loads(path.read_text(encoding="utf-8"))
            if re.sub(r"_\d+$", "", case["case_id"]) != family:
                continue
            stream = case["card_stream"]
            present = {c["card_id"] for c in stream}
            rng = random.Random(case["case_id"])
            added = 0
            for draft in active:
                if draft["card_id"] in present:
                    continue
                if len(stream) >= MAX_CARDS:
                    # A longer variant of the family takes fewer distractors.
                    summary.append(f"    {case['case_id']}: sin espacio para {draft['card_id']}")
                    continue
                # Position 0 stays first (the case's opening card).
                stream.insert(rng.randint(1, len(stream)), build_card(draft))
                added += 1
            if len(stream) > MAX_CARDS:
                errors.append(f"{case['case_id']}: {len(stream)} cartas (máximo {MAX_CARDS})")
                continue
            keep += sum(c["expected_action"] == "keep" for c in stream)
            discard += sum(c["expected_action"] == "discard" for c in stream)
            if added:
                inserted += added
                files += 1
                if not check:
                    path.write_text(json.dumps(case, ensure_ascii=False, indent=4), encoding="utf-8")
        summary.append(f"  {family}: {len(paths)} casos, descarte {discard / (keep + discard):.0%}")

    print("\n".join(summary))
    for e in errors:
        print("ERROR:", e)
    print(f"{inserted} cartas {'se insertarían' if check else 'insertadas'} en {files} casos")
    return 1 if errors or (check and inserted) else 0


if __name__ == "__main__":
    sys.exit(main())
