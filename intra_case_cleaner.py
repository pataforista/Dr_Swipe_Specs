import json
import os
from pathlib import Path

BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")

def clean_case(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except:
            return False
            
    if not isinstance(data, dict):
        return False
        
    original_cards = data.get("card_stream", [])
    if not original_cards:
        return False
        
    unique_cards = []
    seen_texts = set()
    
    for card in original_cards:
        text = card.get("card_text", "").strip()
        if text not in seen_texts:
            unique_cards.append(card)
            seen_texts.add(text)
            
    if len(unique_cards) != len(original_cards):
        data["card_stream"] = unique_cards
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return True
    return False

def main():
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    cleaned_count = 0
    
    for f_path in case_files:
        if clean_case(f_path):
            cleaned_count += 1
            
    print(f"Cleaned duplicates in {cleaned_count} files.")

if __name__ == "__main__":
    main()
