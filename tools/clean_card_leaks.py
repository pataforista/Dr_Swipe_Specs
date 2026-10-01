#!/usr/bin/env python3
"""Remove answer leaks from the card text and mentor comments of the corpus.

Card text is what the player reads *before* deciding, so anything in it that
encodes the expected action turns the decision into pattern matching:

- Exam option letters ("F) ", "G) ", "H) ", "I) "): carried over from the
  exam-style source, they appear on ~2,400 cards and mean "keep" ~95% of the
  time.
- Verdict labels ("Dato anecdótico:", "Contraindicado:", "Información
  redundante:", "Ruido en el expediente:"): only ever on discard cards.
- Framing labels ("Hallazgo:", "Evidencia clínica:", "Dato de importancia:")
  are not verdicts on their own, but they are generated boilerplate that
  chains with the ones above and adds nothing to read.

Mentor comments had the runtime feedback prefixes ("🧹 DESCARTE
RECOMENDADO:", "🎯 DATO CLAVE OMITIDO:" ...) baked into the data, so the game
printed them twice and the mentor's name leaked through the colon split.

Only leading labels are stripped: the clinical statement itself is never
rewritten. The script is idempotent.

Usage: python3 tools/clean_card_leaks.py <cases_dir> [--check]
  --check  report what would change and exit 1 if anything would.
"""
import json
import re
import sys
from pathlib import Path

# Accent-less spellings exist in the corpus too ("Evidencia clinica").
LABELS = (
    "Hallazgo cl[ií]nico", "Hallazgo", "Evidencia cl[ií]nica", "Evidencia",
    "Dato de importancia", "Dato anecd[oó]tico", "Contraindicado",
    "Informaci[oó]n redundante", "Ruido en el expediente",
)
LEADING_LEAKS_RE = re.compile(
    r"^\s*(?:(?:" + "|".join(LABELS) + r")\s*:\s*|[A-J]\)\s+)+"
)

COMMENT_PREFIXES = (
    "DESCARTE RECOMENDADO", "DATO CLAVE OMITIDO",
    "LETAL SI SE ACEPTA", "LETAL SI SE DESCARTA",
    "Nota clínica", "Punto clave", "Recordatorio",
)
# The prefixes appear with their emoji, without it, and with the emoji
# mangled into mojibake ("ðYZ¯ DATO CLAVE OMITIDO:"), so any one token in
# front of the label goes with it.
COMMENT_PREFIX_RE = re.compile(
    r"^\s*(?:(?:\S+\s+)?(?:" + "|".join(re.escape(p) for p in COMMENT_PREFIXES) + r")\s*:\s*)+"
)


# "TA N/A, FC 95 lpm, Temp 37.8°C": template placeholders for a value the
# case never had. Dropped when other values remain; an all-N/A card is left
# for clinical review (report_content_review.py lists it).
NA_ITEM_RE = re.compile(r"\b(?:TA|FC|FR|Temp|SatO2)\s+N/A(?:,\s*|\s*$)")


def clean_text(text: str) -> str:
    cleaned = LEADING_LEAKS_RE.sub("", text).strip()
    without_na = NA_ITEM_RE.sub("", cleaned).strip().rstrip(",").strip()
    if without_na and re.search(r"\d", without_na):
        cleaned = without_na
    # Never leave a card blank. Case is kept as authored ("hCG", "t de Student").
    return cleaned or text


def clean_comment(comment: str) -> str:
    return COMMENT_PREFIX_RE.sub("", comment).strip() or comment


def clean_case(case: dict) -> int:
    changes = 0
    for card in case.get("card_stream", []):
        text = card.get("card_text", "")
        new_text = clean_text(text)
        if new_text != text:
            card["card_text"] = new_text
            changes += 1
        scoring = card.get("scoring") or {}
        comment = scoring.get("vazquez_comment")
        if comment:
            new_comment = clean_comment(comment)
            if new_comment != comment:
                scoring["vazquez_comment"] = new_comment
                changes += 1
    return changes


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    cases_dir = Path(sys.argv[1])
    check = "--check" in sys.argv[2:]
    total = files = 0
    for path in sorted(cases_dir.glob("CASE_*.json")):
        case = json.loads(path.read_text(encoding="utf-8"))
        changes = clean_case(case)
        if not changes:
            continue
        total += changes
        files += 1
        if not check:
            # Same layout as the corpus: 4-space indent, UTF-8, no trailing newline.
            path.write_text(json.dumps(case, ensure_ascii=False, indent=4), encoding="utf-8")
    verb = "cambiarían" if check else "corregidos"
    print(f"{total} campos {verb} en {files} casos")
    return 1 if check and total else 0


if __name__ == "__main__":
    sys.exit(main())
