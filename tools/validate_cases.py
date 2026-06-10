#!/usr/bin/env python3
"""CI guard for the clinical case corpus.

Rejects the corruption patterns that reached production in the past
(mojibake, U+FFFD, cross-case contamination) plus authoring contradictions.

Usage: python3 tools/validate_cases.py <cases_dir>
Exit code 0 = clean, 1 = findings (printed to stdout).
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

# C1 control chars are the fingerprint of a broken UTF-8 re-decode.
C1_RE = re.compile("[\u0080-\u009f]")
# "DiagnA³stico", "36.6A°C": an accented vowel decayed into "A" + symbol.
MOJIBAKE_RE = re.compile(r"[A-Za-z]A[³°¡º±]|Ã[©³­±¡]")
REPLACEMENT = "�"


def validate_case(path: Path) -> list[str]:
    errors: list[str] = []
    raw = path.read_text(encoding="utf-8")

    if REPLACEMENT in raw:
        errors.append("contiene U+FFFD (texto ilegible)")
    if C1_RE.search(raw):
        errors.append("contiene bytes de control C1 (mojibake)")
    if MOJIBAKE_RE.search(raw):
        errors.append(f"patrón mojibake: {MOJIBAKE_RE.search(raw).group(0)!r}")

    try:
        case = json.loads(raw)
    except json.JSONDecodeError as exc:
        return errors + [f"JSON inválido: {exc}"]

    case_id = case.get("case_id", "")
    if not case_id.isascii():
        errors.append(f"case_id no es ASCII: {case_id!r}")
    if unicodedata.normalize("NFC", f"CASE_{case_id}") != path.stem:
        errors.append(f"case_id {case_id!r} no coincide con el archivo {path.stem!r}")

    cards = case.get("card_stream", [])
    if not 3 <= len(cards) <= 15:
        errors.append(f"card_stream con {len(cards)} cartas (esperado 3-15)")

    seen_ids: set[str] = set()
    init_vitals = 0
    for card in cards:
        cid = card.get("card_id", "?")
        if cid in seen_ids:
            errors.append(f"card_id duplicado: {cid} (huella de contaminación cruzada)")
        seen_ids.add(cid)
        if cid == "init_vitals":
            init_vitals += 1
        if card.get("expected_action") not in ("keep", "discard"):
            errors.append(f"{cid}: expected_action inválido: {card.get('expected_action')!r}")
        # Authoring contradiction: a card that calls itself noise must not be a keep.
        if card.get("expected_action") == "keep" and re.search(
            r"informaci.n redundante|puro ruido", card.get("card_text", ""), re.I
        ):
            errors.append(f"{cid}: expected_action=keep pero el texto se declara ruido/redundante")
    if init_vitals > 1:
        errors.append(f"{init_vitals} cartas init_vitals (máximo 1, huella de contaminación)")

    triad = case.get("boss_fight_triad")
    if triad is not None:
        questions = triad.get("questions", [])
        if not questions:
            errors.append("boss_fight_triad sin preguntas (crashearía el ShockRoom)")
        for i, q in enumerate(questions):
            options = q.get("options", [])
            ci = q.get("correct_index", -1)
            if not isinstance(ci, int) or not 0 <= ci < len(options):
                errors.append(f"boss Q{i}: correct_index {ci} fuera de rango ({len(options)} opciones)")

    return errors


def main() -> int:
    cases_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "dr-swipe/public/cases")
    files = sorted(cases_dir.glob("CASE_*.json"))
    if not files:
        print(f"ERROR: no se encontraron casos en {cases_dir}")
        return 1

    total_errors = 0
    for path in files:
        errors = validate_case(path)
        if errors:
            total_errors += len(errors)
            print(f"\n✗ {path.name}")
            for err in errors:
                print(f"    - {err}")

    index_path = cases_dir / "case_index.json"
    if index_path.exists():
        index = set(json.loads(index_path.read_text(encoding="utf-8")))
        on_disk = {p.stem.removeprefix("CASE_") for p in files}
        for missing in sorted(index - on_disk):
            total_errors += 1
            print(f"✗ case_index.json apunta a un caso inexistente: {missing}")
        for orphan in sorted(on_disk - index):
            total_errors += 1
            print(f"✗ caso fuera del índice: {orphan}")

    if total_errors:
        print(f"\n{total_errors} errores en el corpus ({len(files)} casos revisados)")
        return 1
    print(f"OK: {len(files)} casos válidos en {cases_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
