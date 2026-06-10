import json
import os
import re
from pathlib import Path

# Paths
BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")

# Common encoding artifacts
ENCODING_FIXES = {
    "â‰¥": "≥",
    "â‰¤": "≤",
    "â€": "—",
    "Ã©": "é",
    "Ã¡": "á",
    "Ã": "í", # This one is tricky as it's often just 'i' with garnish
    "Ã³": "ó",
    "Ãº": "ú",
    "Ã±": "ñ",
    "Âº": "º",
    "Â": "" # Often a stray non-breaking space
}

def fix_encoding(text):
    if not text: return text
    new_text = text
    for junk, good in ENCODING_FIXES.items():
        new_text = new_text.replace(junk, good)
    return new_text

def process_cases():
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    fixed_count = 0
    
    for f_path in case_files:
        try:
            with open(f_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = fix_encoding(content)
            
            if new_content != content:
                # Validate it's still valid JSON
                json.loads(new_content)
                with open(f_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                fixed_count += 1
        except Exception as e:
            # If multi-byte madness happened, try different encodings or just skip
            print(f"Error {f_path.name}: {e}")
            
    print(f"Fixed encoding in {fixed_count} files.")

if __name__ == "__main__":
    process_cases()
