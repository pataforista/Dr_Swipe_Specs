#!/usr/bin/env python3
"""Build the clinical review list for gameplay-relevant content problems.

These are the issues a script must not fix on its own, because the fix is a
clinical judgement:

- balance:      case families where "keep" dominates. A player who always
                swipes right is right ~74% of the time; each family gets the
                number of discard cards it lacks to reach 40%.
- contradiction: discard cards whose own mentor comment urges action
                ("¡Urgente! … Plan C inmediato"), i.e. the comment was written
                for a keep card.
- vacia:        vitals cards with no value at all ("TA N/A, FC N/A, Temp N/A").
- vitals:       vitals cards marked discard although the values are clearly
                abnormal (hypotension, marked tachycardia, fever ≥39, SatO2 <92).
                Sometimes intended ("don't stop to stare at the monitor, act"),
                sometimes an authoring error; a clinician decides.

Usage: python3 tools/report_content_review.py <cases_dir> <out.csv>
"""
import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

TARGET_DISCARD_RATIO = 0.40

ACTION_URGED_RE = re.compile(
    r"urgente|inmediat|descompens|activa (el )?c[oó]digo|plan [bc]\b|estado de choque|no lo ignores|dato clave",
    re.I,
)

APPROVES_RE = re.compile(r"^\s*(?:\w+:\s*)?(?:¡?(?:Bien|No|Correcto|Exacto|Perfecto|Muy bien)\b)", re.I)


def abnormal_vitals(text: str) -> list[str]:
    found = []
    m = re.search(r"TA\s*(\d{2,3})\s*/\s*(\d{2,3})", text)
    if m and int(m.group(1)) < 90:
        found.append(f"TAS {m.group(1)}")
    m = re.search(r"FC\s*(\d{2,3})", text)
    if m and int(m.group(1)) >= 130:
        found.append(f"FC {m.group(1)}")
    m = re.search(r"Temp\w*\s*(\d{2}(?:\.\d)?)", text)
    if m and float(m.group(1)) >= 39:
        found.append(f"T {m.group(1)}")
    m = re.search(r"SatO2\s*(\d{2,3})", text)
    if m and int(m.group(1)) < 92:
        found.append(f"SatO2 {m.group(1)}")
    return found


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    cases_dir, out_path = Path(sys.argv[1]), Path(sys.argv[2])
    rows = []
    families: dict[str, dict[str, int]] = defaultdict(lambda: {"keep": 0, "discard": 0, "cases": 0})

    for path in sorted(cases_dir.glob("CASE_*.json")):
        case = json.loads(path.read_text(encoding="utf-8"))
        case_id = case["case_id"]
        family = re.sub(r"_\d+$", "", case_id)
        families[family]["cases"] += 1
        for card in case.get("card_stream", []):
            action = card.get("expected_action")
            families[family][action] += 1
            text = card.get("card_text", "")
            comment = (card.get("scoring") or {}).get("vazquez_comment", "")
            base = {"case_id": case_id, "card_id": card.get("card_id"), "expected_action": action,
                    "card_text": text, "vazquez_comment": comment}
            # A comment that opens by approving the discard ("¡Bien! Un BI-RADS 5
            # exige acción inmediata") urges action *elsewhere*; not a contradiction.
            approves = APPROVES_RE.match(comment) or re.search(r"no requiere", comment, re.I)
            if action == "discard" and ACTION_URGED_RE.search(comment) and not approves:
                rows.append({"tipo": "contradiccion", **base,
                             "motivo": "Carta de descarte cuyo comentario pide actuar: ¿debería ser 'keep'?"})
            if re.fullmatch(r"(?:\s*(?:TA|FC|FR|Temp|SatO2)\s+N/A,?)+\s*", text):
                rows.append({"tipo": "vacia", **base,
                             "motivo": "Carta de vitales sin ningún valor (plantilla): eliminar o completar"})
            vitals = abnormal_vitals(text) if action == "discard" else []
            if vitals:
                rows.append({"tipo": "vitales", **base,
                             "motivo": f"Vitales anormales ({', '.join(vitals)}) marcados como descarte"})

    balance_rows = []
    for family, c in families.items():
        total = c["keep"] + c["discard"]
        missing = max(0, round((TARGET_DISCARD_RATIO * total - c["discard"]) / (1 - TARGET_DISCARD_RATIO)))
        if missing:
            per_case = round(missing / c["cases"], 1)
            balance_rows.append({
                "tipo": "balance", "case_id": family, "card_id": "", "expected_action": "",
                "card_text": f"{c['cases']} casos · aceptar {c['keep']} / descartar {c['discard']} "
                             f"({c['discard'] / total:.0%} descarte)",
                "vazquez_comment": "",
                "motivo": f"Faltan ~{per_case} cartas de descarte por caso para llegar a {TARGET_DISCARD_RATIO:.0%}",
            })
    balance_rows.sort(key=lambda r: float(r["motivo"].split("~")[1].split()[0]), reverse=True)

    fields = ["tipo", "case_id", "card_id", "expected_action", "card_text", "vazquez_comment", "motivo"]
    # utf-8-sig so Excel opens the accents correctly, like the other review CSVs.
    with out_path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows + balance_rows)

    counts = defaultdict(int)
    for r in rows + balance_rows:
        counts[r["tipo"]] += 1
    print(f"{out_path}: " + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
