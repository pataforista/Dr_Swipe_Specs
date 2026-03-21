import os
import json

cases_dir = r'c:\Users\Admin\Desktop\Juegos ENARM\Dr_Swipe_Specs\cases'
report_file = r'c:\Users\Admin\Desktop\Juegos ENARM\Dr_Swipe_Specs\cases\audit_results.json'
report = []

for filename in os.listdir(cases_dir):
    if filename.startswith('CASE_PROC_') and filename.endswith('.json'):
        path = os.path.join(cases_dir, filename)
        try:
            with open(path, 'r', encoding='utf-8-sig') as f:
                data = json.load(f)
                
                issues = []
                cards = data.get('card_stream', [])
                if len(cards) < 10:
                    issues.append(f"Short: {len(cards)} cards")
                
                if not data.get('boss_fight_triad'):
                    issues.append("Missing triad")
                
                if issues:
                    report.append({"file": filename, "issues": issues})
        except Exception as e:
            report.append({"file": filename, "error": str(e)})

with open(report_file, 'w', encoding='utf-8') as rf:
    json.dump(report, rf, indent=2)

print(f"Audit complete. Results in {report_file}")
