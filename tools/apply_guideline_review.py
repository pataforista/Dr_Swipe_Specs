#!/usr/bin/env python3
"""Apply the guideline review of vitals cards (REVISION_CONTENIDO_JUGABILIDAD.csv).

The template vitals card of many cases was authored as "discard" with a
"No te detengas en estos signos…, R1" comment. The intent (do not delay the
action waiting for studies) is sound, but it was applied to the vital signs
that *define* the action: shock in an infant with diarrhoea (Plan C), shock
index >1 in postpartum haemorrhage, haemodynamic instability in ectopic
pregnancy, septic shock, tension pneumothorax, cholangitis severity, and
hypoxaemia in paediatric pneumonia. Those cards become "keep", with a
comment that is valid whether the player was right or wrong.

Sources:
- WHO/IMCI diarrhoea treatment plans (Plan C: shock signs -> IV fluids).
- FIGO 2022 PPH recommendations (shock index >=0.9 / >1).
- ACOG Practice Bulletin 193 (instability: surgery; methotrexate contraindicated).
- Sepsis-3, Singer et al. JAMA 2016 (vasopressor for MAP >=65 + lactate >2).
- ATLS 10th ed. (tension pneumothorax is a clinical diagnosis).
- Tokyo Guidelines 2018 (cholangitis grade II: T >=39 C; grade III: hypotension).
- BTS CAP in children (SpO2 <=92%: admit and give oxygen).
- AHA/ASA 2019 acute ischaemic stroke (BP <185/110 to start alteplase).
- Gibbs criteria / ACOG Committee Opinion 712 (maternal fever is the required
  criterion of intraamniotic infection; maternal tachycardia supports it).

Also removes the placeholder "TA N/A, FC N/A, Temp N/A" card from the
statistics cases (there is no patient), and rewrites the comment of the
moderate-dehydration vitals card, which stays "discard" (Plan B is defined
by clinical signs) but whose comment told the player to start Plan B.

Idempotent. Usage: python3 tools/apply_guideline_review.py <cases_dir> [--check]
"""
import json
import re
import sys
from pathlib import Path

# (case_id regex, card_text regex, changes, expected match count)
KEEP_LETHAL = {"expected_action": "keep", "lethal": True, "error_type": "lethal_omission", "points": 100}
KEEP = {"expected_action": "keep", "lethal": False, "error_type": "omission", "points": 100}

RULES = [
    (r"^PROC_PED_(GAST|GIT)_DEHYDRATION_", r"^FC 180 lpm .*TA 70/40", {**KEEP_LETHAL,
     "comment": "Navarro: Taquicardia extrema e hipotensión en un lactante deshidratado son signos de choque: definen el Plan C con líquidos IV inmediatos."}, 7),
    (r"^PROC_PED_(GAST|GIT)_DEHYDRATION_", r"^FC 135 lpm .*TA 105/65", {
     "comment": "Navarro: El Plan B lo definen los signos clínicos (irritabilidad, ojos hundidos, sed ávida, pliegue lento); estos vitales no muestran choque."}, 7),
    (r"^PROC_OBG_HEMORRHAGE_HPP_", r"^TA 85/50 mmHg, FC 125 lpm", {**KEEP_LETHAL,
     "comment": "Vázquez: Índice de choque (FC/TAS) mayor de 1: hemorragia grave. Activa el Código Mater y prepara la transfusión."}, 5),
    (r"^PROC_OBS_HEM_ECTOPIC_", r"^TA 80/40 mmHg, FC 120 lpm", {**KEEP_LETHAL,
     "comment": "Castillo: La inestabilidad hemodinámica contraindica el metotrexato y obliga a cirugía urgente."}, 15),
    (r"^PROC_INF_SEPSIS_SOFA_", r"^TA 85/50 mmHg, FC 115 lpm", {**KEEP_LETHAL,
     "comment": "Navarro: Hipotensión persistente tras 30 mL/kg con lactato mayor de 2: choque séptico (Sepsis-3). Vasopresor para PAM de al menos 65 mmHg."}, 15),
    (r"^PROC_SURG_(ATLS_TENSION_PNEUMO|TRAUMA_ATLS10)_", r"^TA 80/[45]0 mmHg, FC 130 lpm", {**KEEP_LETHAL,
     "comment": "Hipotensión y taquicardia completan el diagnóstico clínico de neumotórax a tensión: descomprime sin esperar la radiografía."}, 15),
    (r"^PROC_SURG_BILIARY_COLANGITIS_", r"^TA 85/50 mmHg, FC 125 lpm", {**KEEP_LETHAL,
     "comment": "Hipotensión en colangitis es disfunción orgánica (Tokyo 2018 grado III): drenaje biliar urgente."}, 1),
    (r"^PROC_SURG_BILIARY_CHOLANGITIS_", r"^TA 100/65, FC 120 lpm, Temp 39\.5", {**KEEP,
     "comment": "Temperatura de 39 °C o más es criterio de colangitis moderada (Tokyo 2018 grado II): considera drenaje biliar temprano."}, 1),
    (r"^PROC_OBS_INFECTION_CORIO_", r"^TA 110/70 mmHg, FC 105 lpm, Temp 38\.5", {**KEEP,
     "comment": "Castillo: Fiebre materna de 38 °C o más es el criterio indispensable de Gibbs; con taquicardia materna mayor de 100 lpm apoya la corioamnionitis."}, 15),
    (r"^PROC_NEUR_STROKE_ISCHEMIC_", r"^TA 170/90 mmHg, FC 110 lpm \(irregular\)", {**KEEP,
     "comment": "Mendoza: TA menor de 185/110 permite iniciar la trombólisis sin antihipertensivo previo; el pulso irregular sugiere fibrilación auricular como fuente cardioembólica."}, 15),
    (r"^PROC_PED_RESPIRATORY_PNEUMONIA_", r"SatO2 91%", {**KEEP,
     "comment": "Navarro: SatO2 de 92% o menos en neumonía pediátrica indica hospitalización y oxígeno suplementario."}, 1),
]
REMOVE = [(r"^PROC_STATS_DX_METRICS_", r"^TA N/A, FC N/A, Temp N/A$", 14)]


def apply(case: dict, counts: list[int], removed: list[int]) -> bool:
    changed = False
    cid = case["case_id"]
    for i, (case_re, text_re, change, _) in enumerate(RULES):
        if not re.search(case_re, cid):
            continue
        for card in case["card_stream"]:
            if not re.search(text_re, card["card_text"]):
                continue
            counts[i] += 1
            scoring = card.setdefault("scoring", {})
            before = json.dumps(card, sort_keys=True)
            if "expected_action" in change:
                card["expected_action"] = change["expected_action"]
                scoring["points"] = change["points"]
                scoring["error_type"] = change["error_type"]
                if change["lethal"]:
                    card.setdefault("safety_flags", {})["lethal_if_discarded"] = True
            scoring["vazquez_comment"] = change["comment"]
            changed |= json.dumps(card, sort_keys=True) != before
    for i, (case_re, text_re, _) in enumerate(REMOVE):
        if re.search(case_re, cid):
            keep = [c for c in case["card_stream"] if not re.search(text_re, c["card_text"])]
            if len(keep) != len(case["card_stream"]):
                removed[i] += len(case["card_stream"]) - len(keep)
                case["card_stream"] = keep
                changed = True
    return changed


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    cases_dir = Path(sys.argv[1])
    check = "--check" in sys.argv[2:]
    counts, removed, files = [0] * len(RULES), [0] * len(REMOVE), 0
    for path in sorted(cases_dir.glob("CASE_*.json")):
        case = json.loads(path.read_text(encoding="utf-8"))
        if apply(case, counts, removed):
            files += 1
            if not check:
                path.write_text(json.dumps(case, ensure_ascii=False, indent=4), encoding="utf-8")
    # Matches are counted on every run (idempotent rules keep matching), so a
    # count that drifts means the corpus changed under the rule.
    ok = True
    for (case_re, text_re, _, expected), n in zip(RULES, counts):
        if n != expected:
            ok = False
            print(f"AVISO: {case_re} / {text_re}: {n} cartas (esperadas {expected})")
    print(f"{files} casos {'cambiarían' if check else 'actualizados'}; "
          f"{sum(counts)} cartas revisadas, {sum(removed)} cartas vacías eliminadas")
    return 1 if (check and files) or not ok else 0


if __name__ == "__main__":
    sys.exit(main())
