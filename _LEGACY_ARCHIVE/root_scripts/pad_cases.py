import json
import os
import random
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")

def get_noise_pool():
    noise_pool = []
    seen_texts = set()
    
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    
    for f_path in case_files:
        with open(f_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except: continue
            
        for card in data.get("card_stream", []):
            # A good noise card for padding is a discard action about labs/vitals/imaging
            if card.get("expected_action") == "discard":
                text = card.get("card_text", "").strip()
                category = card.get("category", "").lower()
                if text not in seen_texts:
                    noise_pool.append(card)
                    seen_texts.add(text)
                    
    return noise_pool

def pad_cases():
    pool = get_noise_pool()
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    padded_count = 0
    
    for f_path in case_files:
        with open(f_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except: continue
            
        cards = data.get("card_stream", [])
        if len(cards) < 10:
            existing_texts = {c.get("card_text", "").strip() for c in cards}
            existing_categories = {c.get("category", "").lower() for c in cards}
            
            # Add cards from pool until 10
            # Try to pick categories not already present to reach the 4-category quota
            candidates = [c for c in pool if c.get("card_text", "").strip() not in existing_texts]
            random.shuffle(candidates)
            
            needed = 10 - len(cards)
            for cand in candidates:
                if needed <= 0: break
                
                cards.append(cand.copy())
                needed -= 1
                padded_count += 1
                
            data["card_stream"] = cards
            with open(f_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
                
    print(f"Padded cases. Added {padded_count} noise cards to short cases.")

if __name__ == "__main__":
    pad_cases()
