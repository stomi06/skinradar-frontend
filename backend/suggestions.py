from fastapi import APIRouter
import sqlite3
import re
from difflib import SequenceMatcher
import unicodedata
from functools import lru_cache
from typing import List, Tuple, Dict, Any, Optional
import psycopg2
import os
from dotenv import load_dotenv

router = APIRouter()

wear_levels = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"]

# Use LRU cache to avoid recalculating similarity for the same inputs
@lru_cache(maxsize=1024)
def normalize_text(text: str) -> str:
    text = text.lower()
    text = ''.join(c for c in unicodedata.normalize('NFKD', text) if not unicodedata.combining(c))
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

@lru_cache(maxsize=512)
def calculate_similarity(query: str, item_name: str) -> float:
    norm_query = normalize_text(query)
    norm_item = normalize_text(item_name)
    
    full_match_ratio = SequenceMatcher(None, norm_query, norm_item).ratio()
    query_words = set(norm_query.split())
    item_words = set(norm_item.split())
    
    word_similarities = []
    
    for qword in query_words:
        best_similarity = 0
        
        # Check for exact word match first (most common case)
        if qword in item_words:
            word_similarities.append(0.95)
            continue
            
        # Check for substrings
        for iword in item_words:
            if qword in iword and qword != iword:
                best_similarity = 0.7
                break
                
        # If no exact or substring match, calculate similarity
        if best_similarity < 0.7:
            for iword in item_words:
                word_similarity = SequenceMatcher(None, qword, iword).ratio()
                
                if word_similarity > 0.7:
                    word_similarity += 0.1
                    
                if len(qword) >= 3 and len(iword) >= 3:
                    q_no_repeats = re.sub(r'(.)\1+', r'\1', qword)
                    i_no_repeats = re.sub(r'(.)\1+', r'\1', iword)
                    if q_no_repeats == i_no_repeats:
                        word_similarity += 0.2
                
                best_similarity = max(best_similarity, word_similarity)
        
        word_similarities.append(best_similarity)
    
    avg_word_similarity = sum(word_similarities) / len(word_similarities) if word_similarities else 0
    final_similarity = (full_match_ratio * 0.2) + (avg_word_similarity * 0.8)
    
    # Add bonuses for exact word matches
    exact_word_matches = sum(1 for qword in query_words if qword in item_words)
    if exact_word_matches > 0:
        final_similarity += 0.25
    
    if exact_word_matches == len(query_words) and len(query_words) > 0:
        final_similarity += 0.3
    
    return final_similarity

def find_image_for_item(cursor, base_fullname: str, need_wear: int, condition: str, 
                       is_stattrak: bool, is_souvenir: bool) -> Tuple[Optional[str], Optional[str], str]:
    """Find image URL for an item based on name and condition"""
    prefix = ""
    if is_stattrak and need_wear == 1:
        # Jeśli to nóż (czyli base_fullname zaczyna się od "★" lub zawiera "Knife")
        if base_fullname.startswith("★") or "Knife" in base_fullname:
            prefix = "★ StatTrak™ "
            # Usuń istniejącą gwiazdkę z base_fullname, żeby nie było dwóch
            base_fullname = base_fullname.replace("★ ", "")
        else:
            prefix = "StatTrak™ "
    elif is_souvenir and need_wear == 1:
        prefix = "Souvenir "
    
    base_fullname_with_prefix = f"{prefix}{base_fullname}"
    fullname = base_fullname_with_prefix
    found_image = None
    found_wear = None
    
    if need_wear == 1:
        # Start from specified condition or Factory New
        start_index = wear_levels.index(condition) if condition in wear_levels else 0
        for i in range(start_index, len(wear_levels)):
            fullname_try = f"{base_fullname_with_prefix} ({wear_levels[i]})"
            cursor.execute("SELECT imageurl FROM skins WHERE market_hash_name = ? LIMIT 1", 
                          (fullname_try,))
            row_img = cursor.fetchone()
            if row_img and row_img[0] and row_img[0] != "None":
                found_image = row_img[0]
                found_wear = wear_levels[i]
                fullname = fullname_try
                break
    elif need_wear == 0:
        # First try with condition if specified
        if condition in wear_levels:
            fullname_try = f"{base_fullname_with_prefix} ({condition})"
            cursor.execute("SELECT imageurl FROM skins WHERE market_hash_name = ? LIMIT 1", 
                          (fullname_try,))
            row_img = cursor.fetchone()
            if row_img and row_img[0] and row_img[0] != "None":
                found_image = row_img[0]
                found_wear = condition
                fullname = fullname_try
        
        # If not found, try without condition
        if not found_image:
            cursor.execute("SELECT imageurl FROM skins WHERE market_hash_name = ? LIMIT 1", 
                         (base_fullname_with_prefix,))
            row_img = cursor.fetchone()
            if row_img and row_img[0] and row_img[0] != "None":
                found_image = row_img[0]
                found_wear = None
                fullname = base_fullname_with_prefix
                
    return found_image, found_wear, fullname

@router.get("/get_image")
def get_image(fullname: str):
    try:
        with sqlite3.connect("images.db") as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT imageurl FROM skins WHERE market_hash_name = ? LIMIT 1", (fullname,))
            row = cursor.fetchone()
            return {"imageurl": row[0] if row else None}
    except Exception as e:
        return {"error": str(e)}

@router.get("/suggestions")
def get_suggestions(query: str, condition: str = "", stattrak: bool = False, souvenir: bool = False):
    # Quick validation
    if not query or len(query.strip()) < 2:
        return []
    
    needs_wear_filter = stattrak or souvenir or (condition in wear_levels)
    
    try:
        # Use context managers for DB connections to ensure proper cleanup
        with sqlite3.connect("all_items.db") as conn_items, sqlite3.connect("images.db") as conn_images:
            cursor_items = conn_items.cursor()
            cursor_images = conn_images.cursor()
            
            # Prepare SQL for initial item selection with better filtering
            if len(query.strip()) <= 6:
                # For short queries, try direct SQL match first
                sql_params = []
                if needs_wear_filter:
                    sql_where = "need_wear = 1 AND LOWER(market_hash_name) LIKE ?"
                else:
                    sql_where = "LOWER(market_hash_name) LIKE ?"
                sql_params.append(f'%{query.lower()}%')
                
                cursor_items.execute(
                    f"SELECT market_hash_name, rarity, description, need_wear FROM items WHERE {sql_where} LIMIT 50",
                    sql_params
                )
                direct_matches = cursor_items.fetchall()
                
                if len(direct_matches) >= 5:
                    rows = direct_matches
                else:
                    # Fallback to filtered query if direct matches not sufficient
                    sql_where = "need_wear = 1" if needs_wear_filter else "1=1"
                    cursor_items.execute(
                        f"SELECT market_hash_name, rarity, description, need_wear FROM items WHERE {sql_where}"
                    )
                    rows = cursor_items.fetchall()
            else:
                # For longer queries, use filtered query directly
                sql_where = "need_wear = 1" if needs_wear_filter else "1=1"
                cursor_items.execute(
                    f"SELECT market_hash_name, rarity, description, need_wear FROM items WHERE {sql_where}"
                )
                rows = cursor_items.fetchall()
            
            # Calculate similarity scores
            items_with_similarity = []
            for row in rows:
                base_fullname, _, _, need_wear = row
                
                # Skip items that can't have StatTrak/Souvenir when selected
                if (stattrak or souvenir) and need_wear != 1:
                    continue
                
                similarity = calculate_similarity(query, base_fullname)
                
                # Different thresholds for different scenarios
                threshold = 0.2 if souvenir and len(query.strip()) <= 5 else \
                           0.25 if souvenir or len(query.strip()) <= 5 else 0.3
                
                if similarity > threshold:
                    # Bonus for Souvenir items
                    if souvenir:
                        similarity += 0.1
                    items_with_similarity.append((row, similarity))
            
            # Sort by similarity (most similar first)
            items_with_similarity.sort(key=lambda x: x[1], reverse=True)
            
            # Take top N matches based on search type
            best_matches_count = 30 if souvenir else 10
            best_matches = items_with_similarity[:best_matches_count]
            
            # Build suggestions list
            suggestions = []
            max_suggestions = 3
            
            # Find images for top matches
            for match_data, _ in best_matches:
                base_fullname, rarity, description, need_wear = match_data
                
                # Find image using helper function
                found_image, found_wear, fullname = find_image_for_item(
                    cursor_images, base_fullname, need_wear, condition, stattrak, souvenir)
                
                # Add to suggestions if image found
                if found_image:
                    prices = get_market_prices(fullname)
                    suggestions.append({
                        "market_hash_name": base_fullname,
                        "rarity": rarity,
                        "description": description,
                        "need_wear": need_wear,
                        "display_fullname": fullname,
                        "display_wear": found_wear,
                        "imageurl": found_image,
                        "is_stattrak": stattrak and need_wear == 1,
                        "is_souvenir": souvenir and need_wear == 1,
                        "prices": prices  # <-- dodaj to pole
                    })
                    
                    # Check if we have enough suggestions
                    if len(suggestions) >= max_suggestions:
                        if not souvenir or len(suggestions) >= max_suggestions:
                            break
            
            # Extra processing for Souvenir items if needed
            if souvenir and len(suggestions) < max_suggestions:
                # Get all items with need_wear = 1
                cursor_items.execute(
                    "SELECT market_hash_name, rarity, description, need_wear FROM items WHERE need_wear = 1"
                )
                items_to_search = cursor_items.fetchall()
                
                # Calculate similarity with lower threshold
                more_items = []
                for row in items_to_search:
                    if any(s["market_hash_name"] == row[0] for s in suggestions):
                        continue  # Skip already found items
                        
                    similarity = calculate_similarity(query, row[0])
                    if similarity > 0.1:  # Very low threshold for extra Souvenir items
                        more_items.append((row, similarity))
                
                more_items.sort(key=lambda x: x[1], reverse=True)
                
                # Process additional items
                for match_data, _ in more_items:
                    if len(suggestions) >= max_suggestions:
                        break
                        
                    base_fullname, rarity, description, need_wear = match_data
                    
                    # Only process need_wear = 1 items for Souvenir
                    if need_wear != 1:
                        continue
                    
                    # Look for images with Souvenir prefix
                    prefix = "Souvenir "
                    base_fullname_with_prefix = f"{prefix}{base_fullname}"
                    
                    for wear in wear_levels:
                        fullname_try = f"{base_fullname_with_prefix} ({wear})"
                        cursor_images.execute(
                            "SELECT imageurl FROM skins WHERE market_hash_name = ? LIMIT 1", 
                            (fullname_try,)
                        )
                        row_img = cursor_images.fetchone()
                        if row_img and row_img[0] and row_img[0] != "None":
                            suggestions.append({
                                "market_hash_name": base_fullname,
                                "rarity": rarity,
                                "description": description,
                                "need_wear": need_wear,
                                "display_fullname": fullname_try,
                                "display_wear": wear,
                                "imageurl": row_img[0],
                                "is_stattrak": False,
                                "is_souvenir": True,
                                "prices": get_market_prices(fullname_try)  # <-- DODAJ TO!
                            })
                            break
                    
                    if len(suggestions) >= max_suggestions:
                        break
            
            return suggestions
            
    except Exception as e:
        return {"error": str(e)}

def get_market_prices(fullname: str):
    prices = {}
    try:
        conn = psycopg2.connect(
            dbname= os.getenv('DB_NAME2'),
            user= os.getenv('DB_USER'),
            password= os.getenv('DB_PASSWORD'),
            host= os.getenv('DB_HOST'),
            port= os.getenv('DB_PORT')
        )
        cursor = conn.cursor()
        for market in ["csfloat", "bitskins", "skinport", "waxpeer"]:
            cursor.execute(
                "SELECT min_price FROM prices WHERE market_hash_name = %s AND source = %s LIMIT 1",
                (fullname, market)
            )
            row = cursor.fetchone()
            prices[market] = float(row[0]) if row and row[0] is not None else None
        cursor.close()
        conn.close()
    except Exception as e:
        print("DB price fetch error:", e)
    return prices