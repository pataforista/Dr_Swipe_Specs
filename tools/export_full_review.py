#!/usr/bin/env python3
"""Export every card of the corpus with what changed against a base commit.

One row per card (plus one per deleted card), so a clinical reviewer can
filter the whole corpus in a spreadsheet instead of reading ~600 JSON diffs.

Columns:
  caso_id, familia, especialidad, dificultad, paciente, posicion (in the
  current deck), card_id, categoria, texto_original / texto_actual,
  accion_original / accion_actual, letal_original / letal_actual, puntos,
  comentario_original / comentario_actual, tipo_cambio, fuente,
  revision_pendiente, descarte_familia_pct.

tipo_cambio (may combine several, separated by "; "):
  sin cambio | carta nueva (distractor) | texto limpiado | comentario limpiado
  | accion cambiada por guia | comentario reescrito por guia
  | carta eliminada (vacia)

Usage: python3 tools/export_full_review.py <cases_dir> <out.csv> [base_ref]
  base_ref defaults to the merge-base with origin/main.
"""
import csv
import importlib.util
import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Source of each guideline-corrected vitals card, by case family.
GUIDELINE_SOURCES = [
    (r"^PROC_PED_(GAST|GIT)_DEHYDRATION_", "OMS/AIEPI, planes de rehidratación (Plan C: signos de choque)"),
    (r"^PROC_OBG_HEMORRHAGE_HPP_", "FIGO 2022, hemorragia posparto (índice de choque)"),
    (r"^PROC_OBS_HEM_ECTOPIC_", "ACOG Practice Bulletin 193 (inestabilidad: cirugía, metotrexato contraindicado)"),
    (r"^PROC_INF_SEPSIS_SOFA_", "Sepsis-3, Singer et al., JAMA 2016 (choque séptico)"),
    (r"^PROC_SURG_(ATLS_TENSION_PNEUMO|TRAUMA_ATLS10)_", "ATLS 10ª ed. (neumotórax a tensión: diagnóstico clínico)"),
    (r"^PROC_SURG_BILIARY_(COLANGITIS|CHOLANGITIS)_", "Tokyo Guidelines 2018 (colangitis: grados II y III)"),
    (r"^PROC_OBS_INFECTION_CORIO_", "ACOG Committee Opinion 712; criterios de Gibbs (fiebre materna)"),
    (r"^PROC_NEUR_STROKE_ISCHEMIC_", "AHA/ASA 2019 (TA <185/110 para trombólisis)"),
    (r"^PROC_OBS_HEM(ORRHAGE)?_DPPNI_", "AJOG 2022 y Medscape (DPPNI con inestabilidad materna: cesárea urgente)"),
    (r"^PROC_PED_RESPIRATORY_PNEUMONIA_", "BTS, neumonía adquirida en la comunidad en niños (SatO2 ≤92%)"),
    (r"^PROC_PED_(GAST|GIT)_DEHYDRATION_", "OMS/AIEPI (Plan B se define por signos clínicos)"),
]

# Cards whose verdict still needs a human decision (see PLAN_SIGUIENTES_PASOS.md).
PENDING = [
    (r"^PROC_PED_EXANT_ROSEOLA_", r"^FC 130 lpm", "Roséola: decidir si un dato que ya está en el escenario cuenta como descarte"),
    (r"^PROC_PED_RESPIRATORY_PNEUMONIA_", r"SatO2 91%", "Umbral de SatO2: se aplicó BTS (≤92%); falta confirmar con la GPC mexicana"),
]


def load_module(name: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, check=True, capture_output=True, text=True).stdout


def lethal(card: dict) -> str:
    sf = card.get("safety_flags") or {}
    if sf.get("lethal_risk"):
        return "lethal_risk"
    if sf.get("lethal_if_discarded"):
        return "lethal_if_discarded"
    return ""


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    cases_dir, out_path = Path(sys.argv[1]), Path(sys.argv[2])
    base = sys.argv[3] if len(sys.argv) > 3 else git("merge-base", "HEAD", "origin/main").strip()
    guideline = load_module("apply_guideline_review")

    # Distractor sources, by (family, card_id).
    dx_source = {}
    for draft_file in sorted((ROOT / "content_drafts").glob("distractores_lote*.json")):
        for family, cards in json.loads(draft_file.read_text(encoding="utf-8"))["familias"].items():
            for card in cards:
                dx_source[(family, card["card_id"])] = card.get("fuente", "")

    base_cases = {}
    listing = git("ls-tree", "--name-only", base, "cases/").split()
    for name in listing:
        if Path(name).name.startswith("CASE_"):
            base_cases[Path(name).stem.removeprefix("CASE_")] = json.loads(git("show", f"{base}:{name}"))

    rows = []
    family_totals = defaultdict(lambda: [0, 0])
    for path in sorted(cases_dir.glob("CASE_*.json")):
        case = json.loads(path.read_text(encoding="utf-8"))
        cid = case["case_id"]
        family = re.sub(r"_\d+$", "", cid)
        old_cards = {c["card_id"]: c for c in (base_cases.get(cid) or {}).get("card_stream", [])}
        new_ids = set()
        for pos, card in enumerate(case["card_stream"], start=1):
            new_ids.add(card["card_id"])
            old = old_cards.get(card["card_id"])
            scoring = card.get("scoring") or {}
            kinds, source = [], ""
            guideline_hit = any(
                re.search(rule[0], cid) and re.search(rule[1], card["card_text"])
                for rule in guideline.RULES
            )
            if old is None:
                kinds.append("carta nueva (distractor)")
                source = dx_source.get((family, card["card_id"]), "")
            else:
                if old["card_text"] != card["card_text"]:
                    kinds.append("texto limpiado")
                if old["expected_action"] != card["expected_action"]:
                    kinds.append("accion cambiada por guia")
                elif guideline_hit and (old.get("scoring") or {}).get("vazquez_comment") != scoring.get("vazquez_comment"):
                    kinds.append("comentario reescrito por guia")
                elif (old.get("scoring") or {}).get("vazquez_comment") != scoring.get("vazquez_comment"):
                    kinds.append("comentario limpiado")
                if guideline_hit:
                    matches = [src for rx, src in GUIDELINE_SOURCES if re.search(rx, cid)]
                    # Dehydration has two entries: the card that flips to keep is
                    # the Plan C one; the one that stays discard cites Plan B.
                    changed = old["expected_action"] != card["expected_action"]
                    source = next((m for m in matches if ("Plan B" in m) != changed), matches[0] if matches else "")
            pending = next((msg for case_rx, text_rx, msg in PENDING
                            if re.search(case_rx, cid) and re.search(text_rx, card["card_text"])), "")
            family_totals[family][card["expected_action"] == "discard"] += 1
            rows.append({
                "caso_id": cid, "familia": family, "especialidad": case.get("theme_config", ""),
                "dificultad": case.get("difficulty", ""), "paciente": case["patient_intro"]["name"],
                "posicion": pos, "card_id": card["card_id"], "categoria": card["category"],
                "texto_original": old["card_text"] if old else "", "texto_actual": card["card_text"],
                "accion_original": old["expected_action"] if old else "", "accion_actual": card["expected_action"],
                "letal_original": lethal(old) if old else "", "letal_actual": lethal(card),
                "puntos": scoring.get("points", ""),
                "comentario_original": (old.get("scoring") or {}).get("vazquez_comment", "") if old else "",
                "comentario_actual": scoring.get("vazquez_comment", ""),
                "tipo_cambio": "; ".join(kinds) or "sin cambio", "fuente": source,
                "revision_pendiente": pending, "descarte_familia_pct": "",
            })
        for card_id, old in old_cards.items():
            if card_id not in new_ids:
                rows.append({
                    "caso_id": cid, "familia": family, "especialidad": case.get("theme_config", ""),
                    "dificultad": case.get("difficulty", ""), "paciente": case["patient_intro"]["name"],
                    "posicion": "", "card_id": card_id, "categoria": old["category"],
                    "texto_original": old["card_text"], "texto_actual": "",
                    "accion_original": old["expected_action"], "accion_actual": "",
                    "letal_original": lethal(old), "letal_actual": "", "puntos": "",
                    "comentario_original": (old.get("scoring") or {}).get("vazquez_comment", ""),
                    "comentario_actual": "", "tipo_cambio": "carta eliminada (vacia)",
                    "fuente": "Carta de plantilla sin ningún valor (TA/FC/Temp N/A): no hay paciente",
                    "revision_pendiente": "", "descarte_familia_pct": "",
                })

    for row in rows:
        keep, discard = family_totals[row["familia"]]
        row["descarte_familia_pct"] = f"{discard / (keep + discard):.0%}" if keep + discard else ""

    fields = list(rows[0].keys())
    # utf-8-sig so Excel opens the accents correctly, like the other review CSVs.
    with out_path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    counts = defaultdict(int)
    for row in rows:
        for kind in row["tipo_cambio"].split("; "):
            counts[kind] += 1
    print(f"{out_path}: {len(rows)} filas (base {base[:8]})")
    for kind, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"  {n:5d}  {kind}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
