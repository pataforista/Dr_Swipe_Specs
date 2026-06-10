import json
import os
import re
from pathlib import Path

# Paths
BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")

def deep_clean_text(text):
    if not text: return text
    
    # 1. Handle common double-encoding patterns
    # These often look like \ufffd\u0000 followed by the char code
    # Example: \u0000³ -> ó
    replacements = {
        "\ufffd\u0000\u00b3": "ó",
        "\ufffd\u0000\u00a1": "¡",
        "\ufffd\u0000\u00a9": "é",
        "\ufffd\u0000\u00ad": "í",
        "\ufffd\u0000\u00ba": "ú",
        "\ufffd\u0000\u00a1": "á", # Note: these overlap in some mangled versions
        "\ufffd\u0000\u00b1": "ñ",
        "\ufffd\u0000\u00bf": "¿",
        "\u0000¡": "¡",
        "\u0000³": "ó",
        "\u0000©": "é",
        "\u0000­": "í",
        "\u0000º": "ú",
        "\u0000¡": "á",
        "\u0000±": "ñ",
        "\u0000¿": "¿",
        "\u0000": "" # Removing the null-wrapper
    }
    
    new_text = text
    for junk, good in replacements.items():
        new_text = new_text.replace(junk, good)
        
    # 2. Re-apply the basic fixes just in case
    basic_fixes = {
        "â‰¥": "≥",
        "â‰¤": "≤",
        "Ã©": "é",
        "Ã¡": "á",
        "Ã­": "í",
        "Ã³": "ó",
        "Ãº": "ú",
        "Ã±": "ñ"
    }
    for junk, good in basic_fixes.items():
        new_text = new_text.replace(junk, good)
        
    return new_text

def process_cases():
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    fixed_count = 0
    
    for f_path in case_files:
        try:
            with open(f_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            new_content = deep_clean_text(content)
            
            if new_content != content:
                # Validate it's still valid JSON
                try:
                    json.loads(new_content)
                    with open(f_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    fixed_count += 1
                except:
                    # If cleaning broke JSON (unlikely but possible with regex), skip
                    pass
        except Exception as e:
            print(f"Error {f_path.name}: {e}")
            
    print(f"Deep cleaned encoding in {fixed_count} files.")

if __name__ == "__main__":
    process_cases()
