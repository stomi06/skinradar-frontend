from fastapi import APIRouter, Query
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
        if base_fullname.startswith("★") or "Knife" in base_fullname:
            prefix = "★ StatTrak™ "
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
        if condition in wear_levels:
            fullname_try = f"{base_fullname_with_prefix} ({condition})"
            cursor.execute("SELECT imageurl FROM skins WHERE market_hash_name = ? LIMIT 1", 
                          (fullname_try,))
            row_img = cursor.fetchone()
            if row_img and row_img[0] and row_img[0] != "None":
                found_image = row_img[0]
                found_wear = condition
                fullname = fullname_try
        
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

@lru_cache(maxsize=128)
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

def price_in_range(prices, price_from, price_to):
    """Sprawdza czy cena mieści się w zadanym zakresie"""
    if price_from is None and price_to is None:
        return True
        
    min_price = None
    for v in prices.values():
        if isinstance(v, (int, float)) and v is not None and v > 0:
            if min_price is None or v < min_price:
                min_price = v
    
    if min_price is None:
        return False
        
    if price_from is not None and price_from != "":
        try:
            price_from_float = float(price_from)
            if min_price < price_from_float:
                return False
        except (ValueError, TypeError):
            pass
            
    if price_to is not None and price_to != "":
        try:
            price_to_float = float(price_to)
            if min_price > price_to_float:
                return False
        except (ValueError, TypeError):
            pass
    
    return True

def clean_base_name(market_hash_name: str) -> str:
    """Usuwa prefixy StatTrak/Souvenir/★ oraz wear z market_hash_name"""
    base_name = market_hash_name.strip()
    for prefix in ['★ StatTrak™ ', 'StatTrak™ ', 'Souvenir ', '★ ']:
        if base_name.startswith(prefix):
            base_name = base_name[len(prefix):]
            break
    for wear in wear_levels:
        pattern = f' ({wear})'
        if base_name.endswith(pattern):
            base_name = base_name[:-len(pattern)]
            break
    return base_name.strip()

def build_fuzzy_search_query(query: str, sort_by: str = "lowest"):
    """Buduje zapytanie fuzzy search z obsługą literówek"""
    price_field = "MIN(p.min_price)" if sort_by == "lowest" else "MAX(p.min_price)"
    order_clause = "ASC" if sort_by == "lowest" else "DESC"
    
    base_query = f"""
    SELECT DISTINCT p.market_hash_name, {price_field} as price,
           CASE WHEN p.market_hash_name ILIKE %s THEN 1 ELSE 0 END as exact_match_score
    FROM prices p WHERE p.min_price IS NOT NULL AND p.min_price > 0
    """
    params = [f"%{query}%"]    
    if len(query.strip()) <= 3:
        base_query += " AND p.market_hash_name ILIKE %s"
        params.append(f"%{query.strip()}%")
    else:
        # Handle typos for single words, AND logic for multiple words
        query_words = query.strip().split()
        if len(query_words) == 1:
            word = query_words[0]
            typo_variants = [f"%{word}%", f"%{word[:-1]}%", f"%{word[1:]}%"]
            
            if len(word) >= 3:
                for i in range(len(word)):
                    typo_variants.append(f"%{word[:i] + word[i] + word[i:]}%")
                no_doubles = re.sub(r'(.)\1+', r'\1', word)
                if no_doubles != word:
                    typo_variants.append(f"%{no_doubles}%")
            
            typo_variants = typo_variants[:10]
            base_query += f" AND ({' OR '.join(['p.market_hash_name ILIKE %s'] * len(typo_variants))})"
            params.extend(typo_variants)
        else:
            # Multiple words - all must be present
            conditions = [f"p.market_hash_name ILIKE %s" for _ in query_words]
            base_query += f" AND ({' AND '.join(conditions)})"
            params.extend([f"%{word}%" for word in query_words])
    
    return base_query, params, order_clause

def get_price_suggestions_fuzzy(
    query: str, 
    condition: str = "", 
    stattrak: bool = False, 
    souvenir: bool = False,
    price_from: float = None,
    price_to: float = None,
    limit: int = 50,
    sort_by: str = "lowest"
):
    """Zoptymalizowana funkcja fuzzy search z pełnym filtrowaniem"""
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('DB_NAME2'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT')
        )
        cursor = conn.cursor()
        
        # Zoptymalizowane zapytanie - pobiera wszystkie ceny od razu
        base_query = """
        SELECT p.market_hash_name, 
               MIN(CASE WHEN p.source = 'csfloat' THEN p.min_price END) as csfloat_price,
               MIN(CASE WHEN p.source = 'bitskins' THEN p.min_price END) as bitskins_price,
               MIN(CASE WHEN p.source = 'skinport' THEN p.min_price END) as skinport_price,
               MIN(CASE WHEN p.source = 'waxpeer' THEN p.min_price END) as waxpeer_price,
               MIN(p.min_price) as min_price
        FROM prices p 
        WHERE p.min_price IS NOT NULL AND p.min_price > 0
        """
        params = []
        
        # Obsługa literówek - skopiowana z build_fuzzy_search_query
        if len(query.strip()) <= 3:
            base_query += " AND p.market_hash_name ILIKE %s"
            params.append(f"%{query.strip()}%")
        else:
            query_words = query.strip().split()
            if len(query_words) == 1:
                word = query_words[0]
                typo_variants = [f"%{word}%", f"%{word[:-1]}%", f"%{word[1:]}%"]
                
                if len(word) >= 3:
                    for i in range(len(word)):
                        typo_variants.append(f"%{word[:i] + word[i] + word[i:]}%")
                    no_doubles = re.sub(r'(.)\1+', r'\1', word)
                    if no_doubles != word:
                        typo_variants.append(f"%{no_doubles}%")
                
                typo_variants = typo_variants[:8]  # Ograniczenie dla wydajności
                base_query += f" AND ({' OR '.join(['p.market_hash_name ILIKE %s'] * len(typo_variants))})"
                params.extend(typo_variants)
            else:
                conditions = [f"p.market_hash_name ILIKE %s" for _ in query_words]
                base_query += f" AND ({' AND '.join(conditions)})"
                params.extend([f"%{word}%" for word in query_words])
        
        # Filtry dla StatTrak/Souvenir
        if stattrak:
            base_query += " AND (p.market_hash_name ILIKE %s OR p.market_hash_name ILIKE %s)"
            params.extend(['%StatTrak™%', '%★ StatTrak™%'])
        elif souvenir:
            base_query += " AND p.market_hash_name ILIKE %s"
            params.append('Souvenir %')
        else:
            base_query += " AND p.market_hash_name NOT ILIKE %s AND p.market_hash_name NOT ILIKE %s AND p.market_hash_name NOT ILIKE %s"
            params.extend(['%StatTrak™%', '%★ StatTrak™%', 'Souvenir %'])
        
        # FILTR KONDYCJI - WAŻNE! To było usunięte!
        if condition and condition in wear_levels:
            base_query += " AND p.market_hash_name ILIKE %s"
            params.append(f'%({condition})%')
        
        # Grupuj po market_hash_name
        base_query += " GROUP BY p.market_hash_name"
        
        # Filtrowanie cenowe w SQL
        if price_from is not None and price_from != "":
            try:
                base_query += " HAVING MIN(p.min_price) >= %s"
                params.append(float(price_from))
            except (ValueError, TypeError):
                pass
                
        if price_to is not None and price_to != "":
            try:
                having_clause = " HAVING MIN(p.min_price) <= %s" if "HAVING" not in base_query else " AND MIN(p.min_price) <= %s"
                base_query += having_clause
                params.append(float(price_to))
            except (ValueError, TypeError):
                pass
        
        # Sortowanie w SQL
        order_clause = "DESC" if sort_by == "highest" else "ASC"
        base_query += f" ORDER BY min_price {order_clause} LIMIT 100"
        
        cursor.execute(base_query, params)
        price_results = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Grupuj przedmioty po base_name i znajdź najlepsze ceny
        item_price_map = {}
        
        for row in price_results:
            market_hash_name = row[0]
            csfloat_price = row[1]
            bitskins_price = row[2] 
            skinport_price = row[3]
            waxpeer_price = row[4]
            min_price = row[5]
            
            base_name = clean_base_name(market_hash_name)
            
            # Sprawdź similarity
            similarity = calculate_similarity(query, base_name)
            if similarity < 0.15:  # Obniżony threshold dla lepszego wyszukiwania
                continue
            
            # Jeśli ten base_name już istnieje, porównaj ceny
            if base_name in item_price_map:
                existing_min_price = item_price_map[base_name]['min_price']
                
                if sort_by == "highest":
                    if min_price <= existing_min_price:
                        continue
                else:
                    if min_price >= existing_min_price:
                        continue
            
            # Stwórz obiekt prices
            all_prices = {
                'csfloat': csfloat_price,
                'bitskins': bitskins_price,
                'skinport': skinport_price,
                'waxpeer': waxpeer_price
            }
            
            item_price_map[base_name] = {
                'market_hash_name': market_hash_name,
                'min_price': min_price,
                'all_prices': all_prices,
                'similarity': similarity
            }
            
            # Early exit - jeśli mamy już 10 przedmiotów, przestajemy przetwarzać
            if len(item_price_map) >= 10:
                break
        
        # Posortuj po cenach i weź tylko 3 najlepsze
        sorted_items = sorted(
            item_price_map.items(), 
            key=lambda x: x[1]['min_price'], 
            reverse=(sort_by == "highest")
        )[:3]
        
        # Buduj suggestions - batch queries dla lepszej wydajności
        suggestions = []
        if sorted_items:
            with sqlite3.connect("images.db") as conn_images, sqlite3.connect("all_items.db") as conn_items:
                cursor_images = conn_images.cursor()
                cursor_items = conn_items.cursor()
                
                # Batch query dla obrazków
                market_hash_names = [item_data['market_hash_name'] for _, item_data in sorted_items]
                image_placeholders = ','.join(['?' for _ in market_hash_names])
                cursor_images.execute(
                    f"SELECT market_hash_name, imageurl FROM skins WHERE market_hash_name IN ({image_placeholders}) AND imageurl IS NOT NULL AND imageurl != 'None'",
                    market_hash_names
                )
                images_map = {row[0]: row[1] for row in cursor_images.fetchall()}
                
                # Batch query dla metadanych
                base_names = [base_name for base_name, _ in sorted_items]
                metadata_placeholders = ','.join(['?' for _ in base_names])
                cursor_items.execute(
                    f"SELECT market_hash_name, rarity, description, need_wear FROM items WHERE market_hash_name IN ({metadata_placeholders})",
                    base_names
                )
                metadata_map = {row[0]: row[1:] for row in cursor_items.fetchall()}
                
                # Sprawdź też z prefiksem ★ dla brakujących
                missing_items = [name for name in base_names if name not in metadata_map and not name.startswith("★")]
                if missing_items:
                    star_names = [f"★ {name}" for name in missing_items]
                    star_placeholders = ','.join(['?' for _ in star_names])
                    cursor_items.execute(
                        f"SELECT market_hash_name, rarity, description, need_wear FROM items WHERE market_hash_name IN ({star_placeholders})",
                        star_names
                    )
                    for row in cursor_items.fetchall():
                        original_name = row[0][2:]  # Usuń "★ "
                        metadata_map[original_name] = row[1:]
                
                for base_name, item_data in sorted_items:
                    market_hash_name = item_data['market_hash_name']
                    
                    # Sprawdź czy mamy obrazek
                    if market_hash_name in images_map:
                        # Pobierz metadane
                        if base_name in metadata_map:
                            rarity, description, need_wear = metadata_map[base_name]
                        else:
                            rarity, description, need_wear = None, None, 1
                        
                        # Określ wear z pełnej nazwy
                        display_wear = None
                        for wear in wear_levels:
                            if f'({wear})' in market_hash_name:
                                display_wear = wear
                                break
                        
                        is_stattrak_item = 'StatTrak™' in market_hash_name
                        is_souvenir_item = market_hash_name.startswith('Souvenir ')
                        
                        suggestions.append({
                            "market_hash_name": base_name,
                            "rarity": rarity,
                            "description": description,
                            "need_wear": need_wear,
                            "display_fullname": market_hash_name,
                            "display_wear": display_wear,
                            "imageurl": images_map[market_hash_name],
                            "is_stattrak": is_stattrak_item,
                            "is_souvenir": is_souvenir_item,
                            "prices": item_data['all_prices']
                        })
        
        return suggestions
        
    except Exception as e:
        print(f"Error in fuzzy search: {e}")
        return []

@lru_cache(maxsize=256)
def get_price_suggestions_cached(query, condition, stattrak, souvenir, price_from, price_to, sort_by):
    """Cached wrapper for price suggestions"""
    return get_price_suggestions_fuzzy(query, condition, stattrak, souvenir, price_from, price_to, 50, sort_by)

@router.get("/suggestions")
def get_suggestions(
    query: str, 
    condition: str = "", 
    stattrak: bool = False, 
    souvenir: bool = False,
    price_from: float = Query(None),
    price_to: float = Query(None),
    sort_by: str = Query("default")
):
    # Quick validation
    if not query or len(query.strip()) < 2:
        return []    # Handle price sorting with fuzzy search
    if sort_by in ["lowest_price", "highest_price"]:
        return get_price_suggestions_cached(
            query, condition, stattrak, souvenir, price_from, price_to, sort_by.replace("_price", "")
        )
    
    needs_wear_filter = stattrak or souvenir or (condition in wear_levels)
    threshold = 0.2 if souvenir and len(query.strip()) <= 5 else \
               0.25 if souvenir or len(query.strip()) <= 5 else 0.3
    
    try:
        with sqlite3.connect("all_items.db") as conn_items, sqlite3.connect("images.db") as conn_images:
            cursor_items = conn_items.cursor()
            cursor_images = conn_images.cursor()
            
            # Get items based on query length
            if len(query.strip()) <= 6:
                sql_where = "need_wear = 1 AND LOWER(market_hash_name) LIKE ?" if needs_wear_filter else "LOWER(market_hash_name) LIKE ?"
                cursor_items.execute(f"SELECT market_hash_name, rarity, description, need_wear FROM items WHERE {sql_where} LIMIT 200", [f'%{query.lower()}%'])
                direct_matches = cursor_items.fetchall()
                
                if len(direct_matches) < 3:
                    sql_where = "need_wear = 1" if needs_wear_filter else "1=1"
                    cursor_items.execute(f"SELECT market_hash_name, rarity, description, need_wear FROM items WHERE {sql_where}")
                    rows = cursor_items.fetchall()
                else:
                    rows = direct_matches
            else:
                sql_where = "need_wear = 1" if needs_wear_filter else "1=1"
                cursor_items.execute(f"SELECT market_hash_name, rarity, description, need_wear FROM items WHERE {sql_where}")
                rows = cursor_items.fetchall()
            
            # Calculate similarities and filter
            items_with_similarity = []
            for row in rows:
                base_fullname, _, _, need_wear = row
                
                # Apply filters
                if ((stattrak or souvenir) and need_wear != 1) or \
                   (not stattrak and ('StatTrak™' in base_fullname)) or \
                   (not souvenir and base_fullname.startswith('Souvenir ')):
                    continue
                
                similarity = calculate_similarity(query, base_fullname)
                if similarity > threshold:
                    items_with_similarity.append((row, similarity))            # Sort by similarity and take best matches
            items_with_similarity.sort(key=lambda x: x[1], reverse=True)
            best_matches_count = 500 if (price_from is not None or price_to is not None) else (100 if souvenir else 50)
            best_matches = items_with_similarity[:best_matches_count]
            
            # Build suggestions
            suggestions = []
            for match_data, similarity_score in best_matches:
                if len(suggestions) >= 3:
                    break
                    
                base_fullname, rarity, description, need_wear = match_data
                
                # Find appropriate wear levels to check
                possible_wears = [condition] if (need_wear == 1 and condition in wear_levels) else \
                               wear_levels if need_wear == 1 else [condition]
                
                for wear in possible_wears:
                    found_image, found_wear, fullname = find_image_for_item(
                        cursor_images, base_fullname, need_wear, wear, stattrak, souvenir)
                    
                    if found_image:
                        prices = get_market_prices(fullname)
                        
                        if price_in_range(prices, price_from, price_to):
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
                                "prices": prices,
                                "similarity": similarity_score
                            })
                            break
              # Sort suggestions by similarity (highest first)
            suggestions.sort(key=lambda x: x.get("similarity", 0), reverse=True)
            
            return suggestions
            
    except Exception as e:
        return {"error": str(e)}
