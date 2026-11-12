#!/usr/bin/env python3
"""Build the full content review workbook, deduplicated by clinical family.

The corpus has 599 cases but most are variants of the same family that share
their cards, boss questions and pearl. Reviewing case by case means reading
the same card up to 15 times. This export lists each distinct item once per
family, with the number of cases it reaches, so a reviewer covers the whole
game in about a fifth of the rows.

Outputs in <out_dir>:
  revision_contenido.xlsx   sheets: LEEME, Familias, Cartas, Preguntas, Perlas,
                            Escenarios, Alertas
  revision_contenido.csv    Cartas + Preguntas + Perlas + Escenarios, flat

Reviewer columns (Veredicto, Corrección, Fuente verificada, Notas) are blank.
The "Alertas" are automatic and heuristic: they point at rows worth a look,
they are not verdicts.

Usage: python3 tools/export_content_review.py <cases_dir> <out_dir>
Requires openpyxl.
"""
import csv
import json
import re
import sys
import unicodedata
from collections import Counter, OrderedDict, defaultdict
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

SPECIALTY = {
    "CARD": "Cardiología", "INT": "Medicina Interna", "GYN": "Ginecología",
    "OBS": "Obstetricia", "OBG": "Obstetricia", "PED": "Pediatría",
    "SURG": "Cirugía y Trauma", "GAST": "Gastroenterología",
    "NEUR": "Neurología", "PSYC": "Psiquiatría", "PSYCH": "Psiquiatría",
    "INF": "Infectología", "ENDO": "Endocrinología", "OPH": "Oftalmología",
    "DERM": "Dermatología", "PREV": "Medicina Preventiva",
    "IM": "Medicina Interna", "ORL": "Otorrinolaringología",
    "STATS": "Bioestadística", "ENGL": "Inglés técnico",
}
REVIEW_COLS = ["Veredicto", "Corrección sugerida", "Fuente verificada", "Notas del revisor"]
VERDICTS = '"Aprobar,Corregir,Rechazar"'
YESNO = '"Sí,No,No aplica"'
LONG_CARD = 200          # characters; longer cards are hard to read under the clock
ACCENT_RATIO = 5         # accented form this many times more frequent than the bare one
HEAD_FILL = PatternFill("solid", fgColor="0F766E")
LETHAL_FILL = PatternFill("solid", fgColor="FFE4E6")
ALERT_FILL = PatternFill("solid", fgColor="FEF3C7")
WORD = re.compile(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{6,}")


def strip_accents(text):
    """Remove acute accents and diaeresis; keep ñ."""
    out = []
    for ch in unicodedata.normalize("NFD", text):
        if unicodedata.category(ch) == "Mn" and ch != "̃":
            continue
        out.append(ch)
    return unicodedata.normalize("NFC", "".join(out))


def family_of(case_id):
    return case_id.rsplit("_", 1)[0]


def split_family(family):
    parts = family.split("_")
    code = parts[1] if parts[0] == "PROC" else parts[0]
    topic = re.sub(r"^PROC_[A-Z]+_|_\d+$", "", family).replace("_", " ").title()
    return SPECIALTY.get(code, "Otras"), topic


def is_lethal(card):
    flags = card.get("safety_flags") or {}
    return bool(flags.get("lethal_risk") or flags.get("lethal_if_discarded"))


def text_values(node):
    """Every string value in a case (keys are never touched)."""
    if isinstance(node, dict):
        for value in node.values():
            yield from text_values(value)
    elif isinstance(node, list):
        for value in node:
            yield from text_values(value)
    elif isinstance(node, str):
        yield node


def build_accent_suspects(cases):
    """Bare words whose accented spelling dominates the corpus."""
    counts = Counter()
    for case in cases:
        for text in text_values(case):
            counts.update(w.lower() for w in WORD.findall(text))
    by_base = defaultdict(dict)
    for word, n in counts.items():
        by_base[strip_accents(word)][word] = n
    suspects = {}
    for base, forms in by_base.items():
        if base not in forms or len(forms) < 2:
            continue
        accented, n_acc = max(((w, n) for w, n in forms.items() if w != base), key=lambda x: x[1])
        if n_acc >= ACCENT_RATIO * forms[base]:
            suspects[base] = accented
    return suspects


def accent_alerts(text, suspects):
    found = OrderedDict()
    for word in WORD.findall(text):
        fix = suspects.get(word.lower())
        if fix:
            found[word] = fix
    return [f"Posible tilde faltante: {w} → {fix}" for w, fix in found.items()]


def collect(cases_dir):
    cases = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(Path(cases_dir).glob("CASE_*.json"))]
    suspects = build_accent_suspects(cases)
    families = OrderedDict()
    for case in cases:
        fam = families.setdefault(family_of(case["case_id"]), {
            "cases": [], "cards": OrderedDict(), "questions": OrderedDict(),
            "pearls": OrderedDict(), "scenarios": OrderedDict(), "discard": 0, "total": 0,
        })
        cid = case["case_id"]
        fam["cases"].append(cid)
        intro = case["patient_intro"]
        fam["scenarios"].setdefault((intro["name"], intro["arrival_scenario"]), {"ids": [], "difficulty": case["difficulty"]})["ids"].append(cid)
        for card in case["card_stream"]:
            fam["total"] += 1
            fam["discard"] += card["expected_action"] == "discard"
            key = (card["card_text"], card["expected_action"], card["scoring"].get("vazquez_comment", ""))
            fam["cards"].setdefault(key, {"card": card, "ids": []})["ids"].append(cid)
        for q in case["boss_fight_triad"]["questions"]:
            text = q.get("q") or q.get("question") or ""
            key = (text, tuple(q["options"]), q["correct_index"])
            fam["questions"].setdefault(key, {"ids": []})["ids"].append(cid)
        pearl = case.get("enarm_pearl") or case.get("perla_enarm")
        if pearl:
            key = (pearl.get("title", ""), pearl.get("text", ""), pearl.get("gpc_ref", ""))
            fam["pearls"].setdefault(key, {"ids": []})["ids"].append(cid)
    return families, suspects


def card_rows(families, suspects):
    rows = []
    for family, fam in families.items():
        spec, topic = split_family(family)
        items = sorted(fam["cards"].items(), key=lambda kv: (not is_lethal(kv[1]["card"]), kv[0][1] != "discard"))
        for (text, action, comment), item in items:
            card = item["card"]
            alerts = accent_alerts(text + " " + comment, suspects)
            if len(text) > LONG_CARD:
                alerts.append(f"Carta larga ({len(text)} caracteres)")
            if not comment.strip():
                alerts.append("Sin comentario del mentor")
            rows.append([
                spec, topic, family, len(item["ids"]), len(fam["cases"]), card["card_id"], card["category"],
                "Sí" if is_lethal(card) else "", "Aceptar" if action == "keep" else "Descartar",
                text, comment, card["scoring"]["points"], " · ".join(alerts),
            ])
    return rows


def question_rows(families, suspects):
    rows = []
    for family, fam in families.items():
        spec, topic = split_family(family)
        for (text, options, correct), item in fam["questions"].items():
            alerts = accent_alerts(text + " " + " ".join(options), suspects)
            right = options[correct]
            others = [o for i, o in enumerate(options) if i != correct]
            if others and len(right) > 1.5 * max(len(o) for o in others):
                alerts.append("La respuesta correcta es mucho más larga que las demás (pista)")
            if len(options) < 3:
                alerts.append(f"Solo {len(options)} opciones")
            if len(set(o.strip().lower() for o in options)) < len(options):
                alerts.append("Opciones repetidas")
            rows.append([
                spec, topic, family, len(item["ids"]), len(fam["cases"]), text, right,
                " | ".join(others), " · ".join(alerts),
            ])
    return rows


def pearl_rows(families, suspects):
    rows = []
    for family, fam in families.items():
        spec, topic = split_family(family)
        for (title, text, gpc), item in fam["pearls"].items():
            alerts = accent_alerts(f"{title} {text} {gpc}", suspects)
            if not gpc.strip():
                alerts.append("Sin referencia de guía")
            rows.append([spec, topic, family, len(item["ids"]), len(fam["cases"]), title, text, gpc, " · ".join(alerts)])
    return rows


def scenario_rows(families, suspects):
    rows = []
    for family, fam in families.items():
        spec, topic = split_family(family)
        for (name, scenario), item in fam["scenarios"].items():
            alerts = accent_alerts(f"{name} {scenario}", suspects)
            if re.search(r"diagn[oó]stico", scenario, re.I):
                alerts.append("El escenario menciona un diagnóstico: ¿adelanta la respuesta?")
            rows.append([spec, topic, family, len(item["ids"]), item["ids"][0], item["difficulty"], name, scenario, " · ".join(alerts)])
    return rows


def family_rows(families, cards, questions, pearls, scenarios):
    def tally(rows, family_col, alert_col):
        count, alerts = Counter(), Counter()
        for row in rows:
            count[row[family_col]] += 1
            alerts[row[family_col]] += bool(row[alert_col])
        return count, alerts

    n_cards, a_cards = tally(cards, 2, -1)
    n_q, a_q = tally(questions, 2, -1)
    n_p, a_p = tally(pearls, 2, -1)
    n_s, a_s = tally(scenarios, 2, -1)
    lethal = Counter(row[2] for row in cards if row[7])
    rows = []
    for family, fam in families.items():
        spec, topic = split_family(family)
        pct = round(100 * fam["discard"] / fam["total"]) if fam["total"] else 0
        notes = []
        if pct < 40:
            notes.append("Descarte < 40 %")
        if len(fam["cases"]) >= 10 and n_s[family] < len(fam["cases"]):
            notes.append("Escenarios repetidos entre variantes")
        rows.append([
            spec, topic, family, len(fam["cases"]), n_cards[family], lethal[family], pct,
            n_q[family], n_p[family], n_s[family],
            a_cards[family] + a_q[family] + a_p[family] + a_s[family], " · ".join(notes),
        ])
    rows.sort(key=lambda r: (r[0], -r[3], r[1]))
    return rows


SHEETS = OrderedDict([
    ("Cartas", (["Especialidad", "Tema", "Familia", "Casos con esta carta", "Casos de la familia", "Card ID",
                 "Categoría", "Riesgo letal", "Acción esperada", "Texto de la carta", "Comentario del mentor",
                 "Puntos", "Alertas automáticas"], [16, 24, 30, 9, 9, 10, 16, 8, 11, 60, 60, 7, 40])),
    ("Preguntas", (["Especialidad", "Tema", "Familia", "Casos con esta pregunta", "Casos de la familia", "Pregunta",
                    "Respuesta correcta", "Opciones incorrectas", "Alertas automáticas"],
                   [16, 24, 30, 9, 9, 60, 40, 60, 40])),
    ("Perlas", (["Especialidad", "Tema", "Familia", "Casos con esta perla", "Casos de la familia", "Título", "Texto",
                 "Guía citada", "Alertas automáticas"], [16, 24, 30, 9, 9, 34, 70, 40, 40])),
    ("Escenarios", (["Especialidad", "Tema", "Familia", "Casos con este escenario", "Caso de ejemplo", "Dificultad",
                     "Paciente", "Escenario de llegada", "Alertas automáticas"], [16, 24, 30, 9, 32, 10, 24, 80, 40])),
])
FAMILY_HEAD = ["Especialidad", "Tema", "Familia", "Casos", "Cartas distintas", "Cartas de riesgo letal",
               "% descarte", "Preguntas distintas", "Perlas", "Escenarios distintos", "Filas con alerta",
               "Observaciones", "Estado de revisión", "Revisor", "Fecha"]
FAMILY_WIDTHS = [16, 26, 32, 7, 9, 9, 9, 10, 7, 10, 9, 36, 14, 14, 12]

LEEME = [
    ("Revisión de contenido de Dr. Swipe", True),
    ("", False),
    ("Qué es este archivo", True),
    ("Todo el contenido del juego, sin repeticiones. Los 599 casos son variantes de unas 70 familias clínicas que "
     "comparten cartas, preguntas y perla; aquí cada elemento distinto aparece una sola vez por familia, con el "
     "número de casos en los que sale.", False),
    ("", False),
    ("Orden sugerido", True),
    ("1. Hoja Familias: elige una familia y anota tu nombre y la fecha al terminarla.", False),
    ("2. Hoja Cartas, filtrada por esa familia. Las de riesgo letal van primero y en rosa.", False),
    ("3. Hoja Preguntas (Shock Room), misma familia.", False),
    ("4. Hoja Perlas y hoja Escenarios, misma familia.", False),
    ("", False),
    ("Qué confirmar en cada fila", True),
    ("Cartas: que la acción esperada (aceptar o descartar) sea correcta para ese paciente y que el comentario del "
     "mentor sea cierto y explique el porqué.", False),
    ("Preguntas: que haya una sola respuesta correcta y que las incorrectas sean verosímiles pero falsas.", False),
    ("Perlas: que el dato sea vigente y que la guía citada lo sostenga.", False),
    ("Escenarios: que el cuadro sea coherente (edad, signos, evolución) y no adelante la respuesta.", False),
    ("", False),
    ("Columnas del revisor", True),
    ("Veredicto: Aprobar, Corregir o Rechazar. Si corriges, escribe el texto correcto en Corrección sugerida.", False),
    ("Fuente verificada: Sí solo si abriste la guía o el artículo y la afirmación aparece ahí.", False),
    ("", False),
    ("Alertas automáticas", True),
    ("Las genera un programa con reglas simples (tildes, longitud, respuesta correcta más larga que las demás, "
     "escenario que nombra un diagnóstico). Son pistas de dónde mirar, no veredictos: puede haber falsos positivos "
     "y una fila sin alerta puede estar mal.", False),
    ("", False),
    ("Regenerar", True),
    ("python3 tools/export_content_review.py cases REVISION_CONTENIDO   (sobrescribe el archivo: guarda antes tu "
     "copia con veredictos)", False),
]


def write_sheet(wb, title, head, widths, rows, lethal_col=None, verdicts=True):
    ws = wb.create_sheet(title)
    head = ["#"] + head + (REVIEW_COLS if verdicts else [])
    widths = [5] + widths + ([13, 45, 11, 30] if verdicts else [])
    ws.append(head)
    for cell in ws[1]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = HEAD_FILL
        cell.alignment = Alignment(wrap_text=True, vertical="center")
    for i, row in enumerate(rows, 1):
        ws.append([i] + row + ([""] * len(REVIEW_COLS) if verdicts else []))
        for cell in ws[i + 1]:
            cell.alignment = Alignment(wrap_text=True, vertical="top")
        if lethal_col is not None and row[lethal_col]:
            for cell in ws[i + 1][: len(row) + 1]:
                cell.fill = LETHAL_FILL
        elif verdicts and row[-1]:
            ws.cell(row=i + 1, column=len(row) + 1).fill = ALERT_FILL
    for i, width in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = width
    ws.freeze_panes = "E2"
    ws.auto_filter.ref = ws.dimensions
    if verdicts and rows:
        last = len(rows) + 1
        first_review = len(head) - len(REVIEW_COLS) + 1
        for col, formula in ((first_review, VERDICTS), (first_review + 2, YESNO)):
            dv = DataValidation(type="list", formula1=formula, allow_blank=True)
            ws.add_data_validation(dv)
            letter = get_column_letter(col)
            dv.add(f"{letter}2:{letter}{last}")
    return ws


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    cases_dir, out_dir = sys.argv[1], Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    families, suspects = collect(cases_dir)
    data = OrderedDict([
        ("Cartas", card_rows(families, suspects)),
        ("Preguntas", question_rows(families, suspects)),
        ("Perlas", pearl_rows(families, suspects)),
        ("Escenarios", scenario_rows(families, suspects)),
    ])
    fam_rows = family_rows(families, *data.values())

    wb = Workbook()
    ws = wb.active
    ws.title = "LEEME"
    ws.column_dimensions["A"].width = 110
    for text, bold in LEEME:
        ws.append([text])
        cell = ws.cell(row=ws.max_row, column=1)
        cell.font = Font(bold=bold, size=14 if ws.max_row == 1 else 11)
        cell.alignment = Alignment(wrap_text=True, vertical="top")

    fam_ws = write_sheet(wb, "Familias", FAMILY_HEAD[:-3], FAMILY_WIDTHS[:-3],
                         [r for r in fam_rows], verdicts=False)
    for offset, (name, width) in enumerate(zip(FAMILY_HEAD[-3:], FAMILY_WIDTHS[-3:])):
        col = len(FAMILY_HEAD) - 3 + 2 + offset
        cell = fam_ws.cell(row=1, column=col, value=name)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = HEAD_FILL
        fam_ws.column_dimensions[get_column_letter(col)].width = width
    state = DataValidation(type="list", formula1='"Pendiente,En curso,Revisada"', allow_blank=True)
    fam_ws.add_data_validation(state)
    letter = get_column_letter(len(FAMILY_HEAD) - 3 + 2)
    state.add(f"{letter}2:{letter}{len(fam_rows) + 1}")
    fam_ws.auto_filter.ref = fam_ws.dimensions

    for title, (head, widths) in SHEETS.items():
        write_sheet(wb, title, head, widths, data[title], lethal_col=7 if title == "Cartas" else None)

    alert_rows = []
    for title, rows in data.items():
        for row in rows:
            if row[-1]:
                detail = row[9] if title == "Cartas" else row[5] if title != "Escenarios" else row[7]
                alert_rows.append([title, row[0], row[1], row[2], detail, row[-1]])
    write_sheet(wb, "Alertas", ["Hoja", "Especialidad", "Tema", "Familia", "Texto", "Alerta"],
                [12, 16, 24, 30, 70, 50], alert_rows, verdicts=False)
    wb.save(out_dir / "revision_contenido.xlsx")

    with open(out_dir / "revision_contenido.csv", "w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        writer.writerow(["Tipo", "Especialidad", "Tema", "Familia", "Casos", "Texto principal", "Detalle 1",
                         "Detalle 2", "Riesgo letal", "Alertas automáticas"] + REVIEW_COLS)
        for row in data["Cartas"]:
            writer.writerow(["Carta", row[0], row[1], row[2], row[3], row[9], f"Acción: {row[8]}", row[10], row[7], row[-1], "", "", "", ""])
        for row in data["Preguntas"]:
            writer.writerow(["Pregunta", row[0], row[1], row[2], row[3], row[5], f"Correcta: {row[6]}", f"Incorrectas: {row[7]}", "", row[-1], "", "", "", ""])
        for row in data["Perlas"]:
            writer.writerow(["Perla", row[0], row[1], row[2], row[3], row[5], row[6], row[7], "", row[-1], "", "", "", ""])
        for row in data["Escenarios"]:
            writer.writerow(["Escenario", row[0], row[1], row[2], row[3], row[6], row[7], row[5], "", row[-1], "", "", "", ""])

    total = sum(len(rows) for rows in data.values())
    print(f"{len(families)} familias; {total} filas "
          + ", ".join(f"{len(rows)} {name.lower()}" for name, rows in data.items())
          + f"; {len(alert_rows)} con alerta; {len(suspects)} palabras con posible tilde faltante")
    by_kind = Counter()
    for row in alert_rows:
        for part in row[-1].split(" · "):
            by_kind[(row[0], re.sub(r"[:(].*", "", part).strip())] += 1
    for (sheet, kind), n in sorted(by_kind.items(), key=lambda kv: -kv[1]):
        print(f"  {n:4d}  {sheet}: {kind}")


if __name__ == "__main__":
    main()
