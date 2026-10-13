#!/usr/bin/env python3
"""Apply the 2026-10-13 review of the lethal-risk cards (REVISION_CLINICA).

Each fix names the card by the start of its text and rewrites its mentor
comment and/or source. Fixes go to content_drafts/*.json (the source of the
distractor lots) and to the cases that carry the card, so
insert_distractors.py --check stays green. Every source cited here was
located in PubMed or Consensus; see REVISION_CLINICA/VEREDICTOS_RIESGO_LETAL.md.

Idempotent. Usage: python3 tools/apply_clinical_review_2026_10.py [--check]
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FIXES = [
    {
        "text": "Fibrinólisis sistémica como primera opción en este choque cardiogénico",
        "comment": "Navarro: En el infarto con choque cardiogénico la reperfusión de elección es la ICP inmediata. La fibrinólisis solo se considera si la ICP no puede hacerse a tiempo.",
        "fuente": "Samsky MD et al., Cardiogenic Shock After Acute Myocardial Infarction: A Review, JAMA 2021 (doi:10.1001/jama.2021.18323); Thiele H et al., CULPRIT-SHOCK, NEJM 2017 (doi:10.1056/NEJMoa1710261)",
    },
    {
        "text": "Tiempo puerta-balón de 4 horas como meta aceptable",
        "comment": "Mendoza: La ICP primaria se hace lo antes posible; si no puede realizarse dentro de los 120 minutos siguientes al diagnóstico, se administra fibrinólisis.",
        "fuente": "Bhatt DL et al., Diagnosis and Treatment of Acute Coronary Syndromes: A Review, JAMA 2022 (doi:10.1001/jama.2022.0358); Vogel B et al., Nat Rev Dis Primers 2019 (doi:10.1038/s41572-019-0090-3)",
    },
    {
        "text": "Transfusión hasta hemoglobina mayor de 10 g/dL",
        "comment": "Navarro: La estrategia es restrictiva: se transfunde con hemoglobina cercana a 7 g/dL y la meta es de 7 a 8 g/dL. Sobretransfundir eleva la presión portal y favorece el resangrado.",
        "fuente": "Baveno VII, J Hepatol 2022 (doi:10.1016/j.jhep.2021.12.022), recomendación 6.2; Villanueva C et al., NEJM 2013 (doi:10.1056/NEJMoa1211801)",
    },
    {
        "text": "Metoclopramida para acelerar el tránsito",
        "fuente": "Ponte CD, Nappi JM, Review of a new gastrointestinal drug: metoclopramide, Am J Hosp Pharm 1981 (doi:10.1093/ajhp/38.6.829): contraindicada en obstrucción, hemorragia o perforación gastrointestinal; ficha técnica",
    },
    {
        "text": "Tocólisis de Rutina: Indicada en todo DPPNI",
        "fuente": "Towers CV et al., Is tocolysis safe in the management of third-trimester bleeding?, Am J Obstet Gynecol 1999 (doi:10.1016/s0002-9378(99)70053-0); Hladky K et al., Placental Abruption, Obstet Gynecol Surv 2002",
    },
    {
        "text": "Metotrexato en la Paciente Inestable",
        "comment": "Castillo: La inestabilidad hemodinámica o los datos de rotura contraindican el metotrexato y obligan a cirugía.",
        "fuente": "ACOG Practice Bulletin 193: Tubal Ectopic Pregnancy, Obstet Gynecol 2018 (doi:10.1097/AOG.0000000000002560)",
    },
    {
        "text": "Reiniciar el antipsicótico a las 24 horas de la mejoría",
        "comment": "Navarro: Tras un síndrome neuroléptico maligno el antipsicótico se reintroduce solo después de un periodo sin fármaco (suele recomendarse al menos 2 semanas), de preferencia con otro agente, a dosis baja y con vigilancia estrecha.",
        "fuente": "Pileggi DJ, Cook AM, Neuroleptic Malignant Syndrome, Ann Pharmacother 2016 (doi:10.1177/1060028016657553); Strawn JR et al., Am J Psychiatry 2007 (doi:10.1176/ajp.2007.164.6.870)",
    },
    {
        "text": "Escala SAD PERSONS como único criterio para decidir el alta",
        "fuente": "NICE NG225 (2022); Steeg S et al., Accuracy of risk scales for predicting repeat self-harm and suicide, BMC Psychiatry 2018 (doi:10.1186/s12888-018-1693-z): AUC 51% para SAD PERSONS",
    },
    {
        "text": "Aspirina junto con el rTPA",
        "fuente": "AHA/ASA 2019, Powers WJ et al., Stroke 2019 (doi:10.1161/STR.0000000000000211); Zinkstok SM et al., ARTIS, Lancet 2012 (doi:10.1016/S0140-6736(12)60949-0)",
    },
]

# Cards that live only in cases (corrected keep -> discard); comment text only.
CASE_FIXES = [
    {
        "text": "Epiglotitis Aguda: H. influenzae tipo b",
        "comment": "Castillo: La epiglotitis cursa con fiebre alta, babeo, posición de trípode y sin tos perruna. Este paciente tiene estridor y mejora con el aire frío: el cuadro es de crup.",
    },
    {
        "text": "Embarazo Ectópico Roto: Dolor pélvico agudo",
        "comment": "Dolor y sangrado transvaginal con choque hipovolémico serían el cuadro de un ectópico roto. Aquí la presión es normal, no hay sangrado transvaginal y el cuadro orienta a apendicitis.",
    },
]

# Typos in the croup triad ("tipe", "hiponía": the triad is cough, stridor, dysphonia).
TEXT_FIXES = [
    ("Virus Parainfluenza tipe 1 y 3", "Virus Parainfluenza tipo 1 y 3"),
    ("estridor e hiponia.", "estridor y disfonía."),
    ("estridor e hiponía.", "estridor y disfonía."),
]


def dump_like(raw: str, data) -> str:
    """Serialize with the file's own indent and trailing newline, so diffs stay minimal."""
    second = raw.split("\n", 2)[1] if "\n" in raw else ""
    indent = len(second) - len(second.lstrip(" ")) or 2
    out = json.dumps(data, ensure_ascii=False, indent=indent)
    return out + ("\n" if raw.endswith("\n") else "")


def main() -> int:
    check = "--check" in sys.argv[1:]
    changed = []

    for path in sorted((ROOT / "content_drafts").glob("*.json")):
        raw = path.read_text(encoding="utf-8")
        data = json.loads(raw)
        dirty = False
        for drafts in data["familias"].values():
            for d in drafts:
                for fx in FIXES:
                    if d["card_text"].startswith(fx["text"]):
                        for src, dst in (("comment", "comment"), ("fuente", "fuente")):
                            if src in fx and d.get(dst) != fx[src]:
                                d[dst] = fx[src]
                                dirty = True
        if dirty:
            changed.append(str(path.relative_to(ROOT)))
            if not check:
                path.write_text(dump_like(raw, data), encoding="utf-8")

    all_fixes = [f for f in FIXES if "comment" in f] + CASE_FIXES
    for path in sorted((ROOT / "cases").glob("CASE_*.json")):
        raw = path.read_text(encoding="utf-8")
        case = json.loads(raw)
        dirty = False
        for card in case["card_stream"]:
            for fx in all_fixes:
                if card["card_text"].startswith(fx["text"]) and card["scoring"].get("vazquez_comment") != fx["comment"]:
                    card["scoring"]["vazquez_comment"] = fx["comment"]
                    dirty = True
            for old, new in TEXT_FIXES:
                if old in card["card_text"]:
                    card["card_text"] = card["card_text"].replace(old, new)
                    dirty = True
        if dirty:
            changed.append(str(path.relative_to(ROOT)))
            if not check:
                path.write_text(dump_like(raw, case), encoding="utf-8")

    print(f"{len(changed)} archivos {'cambiarían' if check else 'cambiados'}")
    for c in changed:
        print("  ", c)
    return 1 if (check and changed) else 0


if __name__ == "__main__":
    sys.exit(main())
