import os
import json
import re

cases_dir = r'c:\Users\Admin\Desktop\Juegos ENARM\Dr_Swipe_Specs\cases'
themes = {}

# 1. Identify themes
for filename in os.listdir(cases_dir):
    if filename.startswith('CASE_PROC_') and filename.endswith('_001_001.json'):
        theme_key = filename.replace('_001_001.json', '')
        themes[theme_key] = filename

print(f"Found {len(themes)} source themes.")

# 2. Propagate
for theme_key, source_file in themes.items():
    source_path = os.path.join(cases_dir, source_file)
    try:
        with open(source_path, 'r', encoding='utf-8-sig') as sf:
            source_data = json.load(sf)
            
        # Extract components to propagate
        cards_to_prop = source_data.get('card_stream', [])
        triad_to_prop = source_data.get('boss_fight_triad', {})
        pearl_to_prop = source_data.get('enarm_pearl', {})
        version_to_prop = source_data.get('version', 'v3_swipe_action')
        
        # 3. Find children
        for child_file in os.listdir(cases_dir):
            if child_file.startswith(theme_key) and not child_file.endswith('_001_001.json'):
                child_path = os.path.join(cases_dir, child_file)
                try:
                    with open(child_path, 'r', encoding='utf-8-sig') as cf:
                        child_data = json.load(cf)
                    
                    # Overwrite while keeping specific metadata
                    child_data['version'] = version_to_prop
                    child_data['card_stream'] = cards_to_prop
                    child_data['boss_fight_triad'] = triad_to_prop
                    child_data['enarm_pearl'] = pearl_to_prop
                    
                    # Update internal case_id if it exists to match filename
                    cid = child_file.replace('CASE_', '').replace('.json', '')
                    child_data['case_id'] = cid
                    
                    with open(child_path, 'w', encoding='utf-8') as cf:
                        json.dump(child_data, cf, indent=2, ensure_ascii=False)
                except Exception as e:
                    print(f"Error processing child {child_file}: {e}")
                    
    except Exception as e:
        print(f"Error processing theme {theme_key}: {e}")

print("Propagation complete.")
