from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncpg
import sqlite3
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

wear_levels = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"]

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    db_params = {
        "user": os.getenv('DB_USER'),
        "password": os.getenv('DB_PASSWORD'),
        "host": os.getenv('DB_HOST'),
        "port": os.getenv('DB_PORT'),
        "database": os.getenv('DB_NAME')
    }
    DATABASE_URL = f"postgresql://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['database']}"

async def get_db_connection():
    conn = await asyncpg.connect(DATABASE_URL)
    return conn
async def check_user_premium_status(steam_id: str) -> bool:
    # Tutaj dodaj logikę sprawdzania czy użytkownik ma Premium
    # Na przykład z tabeli users czy z zewnętrznego API
    try:
        conn = await get_db_connection()
        result = await conn.fetchrow(
            "SELECT is_premium FROM users WHERE steam_id = $1",
            steam_id
        )
        await conn.close()
        return result['is_premium'] if result else False
    except:
        return False
class AlertRequest(BaseModel):
    steam_id: str
    market_hash_name: str
    alert_price: float
    csfloat_price: Optional[float] = None
    skinport_price: Optional[float] = None
    bitskins_price: Optional[float] = None
    waxpeer_price: Optional[float] = None
    shadowpay_price: Optional[float] = None
    skinbaron_price: Optional[float] = None

@router.get("/get_image")
def get_image(market_hash_name: str):
    try:
        with sqlite3.connect("images.db") as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT imageurl FROM skins WHERE market_hash_name = ? LIMIT 1", (market_hash_name,))
            row = cursor.fetchone()
            return {"imageurl": row[0] if row else None}
    except Exception as e:
        return {"error": str(e)}

def clean_base_name(market_hash_name: str) -> str:
    """Usuwa prefixy StatTrak/Souvenir oraz wear z market_hash_name, ale zachowuje gwiazdkę"""
    base_name = market_hash_name.strip()
    has_star = False
    
    # Sprawdź czy ma gwiazdkę
    if base_name.startswith('★'):
        has_star = True
    
    # Usuń prefixy (z gwiazdką)
    for prefix in ['★ StatTrak™ ', 'StatTrak™ ', 'Souvenir ', '★ ']:
        if base_name.startswith(prefix):
            base_name = base_name[len(prefix):]
            break
    
    # Usuń wear level
    for wear in wear_levels:
        pattern = f' ({wear})'
        if base_name.endswith(pattern):
            base_name = base_name[:-len(pattern)]
            break
    
    base_name = base_name.strip()
    
    # Jeśli miał gwiazdkę, dodaj ją z powrotem na początek
    if has_star:
        base_name = f"★ {base_name}"
    
    return base_name

# Dodaj po istniejących endpointach:

@router.get("/item_details")
def get_item_details(market_hash_name: str):
    try:
        cleaned_name = clean_base_name(market_hash_name)
        
        with sqlite3.connect("all_items.db") as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT rarity, description FROM items WHERE market_hash_name = ? LIMIT 1", 
                (cleaned_name,)
            )
            row = cursor.fetchone()
            
            if row:
                return {
                    "rarity": row[0] if row[0] else 'Unknown',
                    "description": row[1] if row[1] else None
                }
            else:
                return {
                    "rarity": 'Unknown',
                    "description": None
                }
                    
    except Exception as e:
        return {
            "error": f"Database error: {str(e)}"
        }

@router.post("/alerts")
async def create_alert(alert: AlertRequest):
    
    if alert.alert_price <= 0:
        raise HTTPException(status_code=400, detail="Alert price must be greater than 0")
    
    try:
        conn = await get_db_connection()
        
        # Sprawdź ile alertów ma użytkownik
        existing_alerts = await conn.fetch(
            "SELECT COUNT(*) as count FROM user_items WHERE steam_id = $1",
            alert.steam_id
        )
        
        current_count = existing_alerts[0]['count'] if existing_alerts else 0
        
        # TUTAJ JEST PROBLEM - sprawdź premium status
        user_data = await conn.fetchrow(
            "SELECT premium FROM user_ids WHERE steam_id = $1",
            alert.steam_id
        )
        
        is_premium = user_data['premium'] if user_data else False    
        max_alerts = 5 if is_premium else 3

        if current_count >= max_alerts:
            error_msg = f"Maximum number of alerts reached ({max_alerts}). {'Upgrade to Premium for more alerts.' if not is_premium else ''}"
            print(f"BLOCKING with error: {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
        
        existing_alert = await conn.fetchrow(
            'SELECT id FROM user_items WHERE steam_id = $1 AND market_hash_name = $2',
            alert.steam_id, alert.market_hash_name
        )
        
        if existing_alert:
            raise HTTPException(status_code=409, detail="Alert for this item already exists")
        
        # Wstaw nowy alert
        await conn.execute(
            '''
            INSERT INTO user_items (
                steam_id, market_hash_name, alert_price, 
                csfloat_price, skinport_price, bitskins_price, 
                waxpeer_price, shadowpay_price, skinbaron_price, added
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ''',
            alert.steam_id,
            alert.market_hash_name,
            alert.alert_price,
            alert.csfloat_price,
            alert.skinport_price,
            alert.bitskins_price,
            alert.waxpeer_price,
            alert.shadowpay_price,
            alert.skinbaron_price,
            datetime.utcnow()
        )
        
        await conn.close()
        return {"message": "Alert created successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/alerts/{steam_id}")
async def get_user_alerts(steam_id: str):
    try:
        conn = await get_db_connection()
        
        alerts = await conn.fetch(
            '''
            SELECT id, steam_id, market_hash_name, alert_price,
                   csfloat_price, skinport_price, bitskins_price,
                   waxpeer_price, shadowpay_price, skinbaron_price, 
                   added
            FROM user_items
            WHERE steam_id = $1 
            ORDER BY added DESC
            ''',
            steam_id
        )
        
        await conn.close()
        
        # Dodaj imageurl, rarity i description dla każdego alertu
        result = []
        for alert in alerts:
            alert_dict = dict(alert)
            
            # Pobierz obrazek z bazy SQLite
            try:
                with sqlite3.connect("images.db") as img_conn:
                    cursor = img_conn.cursor()
                    cursor.execute("SELECT imageurl FROM skins WHERE market_hash_name = ? LIMIT 1", 
                                 (alert_dict['market_hash_name'],))
                    row = cursor.fetchone()
                    alert_dict['imageurl'] = row[0] if row and row[0] else None
            except Exception as e:
                print(f"Error getting image for {alert_dict['market_hash_name']}: {e}")
                alert_dict['imageurl'] = None
            
            # Pobierz rarity i description z bazy all_items.db
            try:
                cleaned_name = clean_base_name(alert_dict['market_hash_name'])
                
                with sqlite3.connect("all_items.db") as items_conn:
                    cursor = items_conn.cursor()
                    cursor.execute(
                        "SELECT rarity, description FROM items WHERE market_hash_name = ? LIMIT 1", 
                        (cleaned_name,)
                    )
                    items_row = cursor.fetchone()
                    
                    if items_row:
                        alert_dict['rarity'] = items_row[0] if items_row[0] else 'Unknown'
                        alert_dict['description'] = items_row[1] if items_row[1] else None
                    else:
                        alert_dict['rarity'] = 'Unknown'
                        alert_dict['description'] = None
                            
            except Exception as e:
                print(f"Error getting item details for {alert_dict['market_hash_name']}: {e}")
                alert_dict['rarity'] = 'Unknown'
                alert_dict['description'] = None
            
            result.append(alert_dict)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: int):
    try:
        conn = await get_db_connection()
        
        result = await conn.execute(
            'DELETE FROM user_items WHERE id = $1',
            alert_id
        )
        
        await conn.close()
        
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Alert not found")
            
        return {"message": "Alert deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")