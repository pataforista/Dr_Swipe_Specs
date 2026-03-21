import json
import os
import re

# Use forward slashes for broader compatibility
base_dir = "c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs"
cases_dir = base_dir + "/cases"

def is_unstable(text):
    text = text.replace(',', '.').replace(':', ' ')
    ta_match = re.search(r'TA\s+(\d+)/(\d+)', text)
    if ta_match:
        pas = int(ta_match.group(1))
        pad = int(ta_match.group(2))
        if pas < 90 or pad < 60: return "hipotensión/choque"
        if pas >= 160 or pad >= 110: return "crisis hipertensiva"
    fc_match = re.search(r'FC\s+(\d+)', text)
    if fc_match:
        fc = int(fc_match.group(1))
        if fc > 105: return "taquicardia"
        if fc < 55: return "bradicardia"
    temp_match = re.search(r'Temp\s+(\d+\.?\d*)', text)
    if temp_match:
        temp = float(temp_match.group(1))
        if temp >= 38.3: return "fiebre"
    return None

fixed_count = 0
if not os.path.exists(cases_dir):
    print(f"Error: Directory not found: {cases_dir}")
    exit(1)

for filename in os.listdir(cases_dir):
    if not filename.endswith(".json"): continue
    filepath = os.path.join(cases_dir, filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        continue
    modified = False
    if "card_stream" not in data: continue
    for card in data["card_stream"]:
        if card.get("card_id") == "init_vitals":
            unstable_reason = is_unstable(card.get("card_text", ""))
            scoring = card.get("scoring", {})
            comment = scoring.get("vazquez_comment", "")
            if unstable_reason and "estables" in comment.lower():
                new_comment = comment.replace("signos estables", f"estos signos de {unstable_reason}")
                new_comment = new_comment.replace("estos signos de crisis hipertensiva", "estos signos de severidad")
                if "ATLS" in str(data.get("case_id", "")):
                    new_comment = new_comment.replace("hipotensión/choque", "choque obstructivo")
                card["scoring"]["vazquez_comment"] = new_comment
                modified = True
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        fixed_count += 1

print(f"Total files fixed: {fixed_count}")
