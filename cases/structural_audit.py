import os
import json

cases_dir = r'c:\Users\Admin\Desktop\Juegos ENARM\Dr_Swipe_Specs\cases'
report = []

for filename in os.listdir(cases_dir):
    if filename.startswith('CASE_PROC_') and filename.endswith('.json'):
        path = os.path.join(cases_dir, filename)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                issues = []
                cards = data.get('card_stream', [])
                card_count = len(cards)
                
                if card_count < 10:
                    issues.append(f"Short card count: {card_count}")
                
                if not data.get('boss_fight_triad'):
                    issues.append("Missing boss_fight_triad")
                else:
                    q_count = len(data['boss_fight_triad'].get('questions', []))
                    if q_count != 3:
                        issues.append(f"Invalid triad question count: {q_count}")
                
                if not data.get('enarm_pearl'):
                    issues.append("Missing enarm_pearl")
                
                if data.get('version') != 'v3_swipe_action':
                    issues.append(f"Old version: {data.get('version')}")
                
                if issues:
                    report.append({
                        "file": filename,
                        "issues": issues
                    })
        except Exception as e:
            report.append({
                "file": filename,
                "error": str(e)
            })

print(json.dumps(report, indent=2))
