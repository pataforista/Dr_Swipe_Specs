import json
import os
from pathlib import Path

BASE_DIR = Path("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")

def optimize_flow(file_path):
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
        
    # Categories that should be at the beginning
    TOP_CATEGORIES = ["vitals", "anamnesis", "exploración física", "historia clínica", "antecedentes"]
    # Categories that should be at the end
    BOTTOM_CATEGORIES = ["seguridad", "complicaciones", "seguimiento", "pronóstico", "prevención"]
    
    top_cards = []
    mid_cards = []
    bottom_cards = []
    
    # Track the special init_vitals card
    init_vitals_card = None
    
    for card in original_cards:
        cid = card.get("card_id", "").lower()
        if cid == "init_vitals":
            init_vitals_card = card
            continue
            
        category = card.get("category", "").lower()
        
        # Check for safety flags as a bottom indicator
        safety_flags = card.get("safety_flags", {})
        is_high_risk = safety_flags.get("lethal_risk") or safety_flags.get("red_flag")
        
        if any(cat in category for cat in TOP_CATEGORIES):
            top_cards.append(card)
        elif any(cat in category for cat in BOTTOM_CATEGORIES) or is_high_risk:
            bottom_cards.append(card)
        else:
            mid_cards.append(card)
            
    # Combine everything
    new_stream = []
    if init_vitals_card:
        new_stream.append(init_vitals_card)
        
    new_stream.extend(top_cards)
    new_stream.extend(mid_cards)
    new_stream.extend(bottom_cards)
    
    if new_stream != original_cards:
        data["card_stream"] = new_stream
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return True
    return False

def main():
    case_files = [f for f in BASE_DIR.glob("*.json") if f.name.startswith("CASE_")]
    optimized_count = 0
    
    for f_path in case_files:
        if optimize_flow(f_path):
            optimized_count += 1
            
    print(f"Optimized flow in {optimized_count} files.")

if __name__ == "__main__":
    main()
