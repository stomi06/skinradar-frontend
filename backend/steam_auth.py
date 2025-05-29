import logging
import os
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
import aiohttp
import asyncpg
import re
from dotenv import load_dotenv
import datetime

# Załaduj zmienne środowiskowe
load_dotenv()

router = APIRouter()

# Pobierz dane z zmiennych środowiskowych
STEAM_API_KEY = os.getenv('STEAM_API_KEY')
STEAM_LOGIN_URL = "https://steamcommunity.com/openid/login"
MOBILE_REDIRECT_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000') + '?'

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    # Jeśli nie ma DATABASE_URL, użyj oddzielnych parametrów jak wcześniej
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

@router.get("/auth/steam")
async def steam_login():
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
    params = {
        'openid.ns': "http://specs.openid.net/auth/2.0",
        'openid.identity': "http://specs.openid.net/auth/2.0/identifier_select",
        'openid.claimed_id': "http://specs.openid.net/auth/2.0/identifier_select",
        'openid.mode': 'checkid_setup',
        'openid.return_to': f"{backend_url}/auth/steam/callback",
        'openid.realm': backend_url
    }
    return RedirectResponse(url=f"{STEAM_LOGIN_URL}?{urlencode(params)}")

@router.get("/auth/steam/callback")
async def steam_callback(request: Request):
    params = dict(request.query_params)
    
    if 'openid.claimed_id' not in params:
        raise HTTPException(status_code=400, detail="Invalid Steam response")
    
    steam_id_match = re.search(r'/id/(\d+)$|/openid/id/(\d+)$', params['openid.claimed_id'])
    if not steam_id_match:
        raise HTTPException(status_code=400, detail="Could not extract Steam ID")
    
    steam_id = steam_id_match.group(1) or steam_id_match.group(2)
    
    async with aiohttp.ClientSession() as session:
        async with session.get(
            "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/",
            params={'key': STEAM_API_KEY, 'steamids': steam_id}
        ) as response:
            if response.status != 200:
                raise HTTPException(status_code=500, detail="Steam API error")
            data = await response.json()
            players = data.get('response', {}).get('players', [])
            if not players:
                raise HTTPException(status_code=404, detail="Steam user not found")
            user_info = players[0]
    
    conn = await get_db_connection()
    try:
        # Wstaw lub aktualizuj rekord
        await conn.execute(
            '''
            INSERT INTO user_ids (steam_id, username, first_login, premium)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (steam_id) DO UPDATE
            SET username = EXCLUDED.username
            ''',
            steam_id,
            user_info['personaname'],
            datetime.datetime.utcnow(),
            False  # Tylko dla nowych użytkowników
        )
        
        # Pobierz aktualne dane
        user_data = await conn.fetchrow(
            'SELECT first_login, premium FROM user_ids WHERE steam_id = $1',
            steam_id
        )
        first_login = user_data['first_login']
        premium = user_data['premium']
        print(f"DEBUG: User {steam_id} username updated, premium status: {premium}")  # Debug
    finally:
        await conn.close()

    redirect_url = (
        f"{MOBILE_REDIRECT_URL}"
        f"username={user_info['personaname']}"
        f"&avatar={user_info['avatarfull']}"
        f"&steamid={steam_id}"
        f"&first_login={first_login.date() if hasattr(first_login, 'date') else first_login}"
        f"&premium={str(premium).lower()}"
    )
    print(f"DEBUG: Redirect URL: {redirect_url}")  # Debug
    return RedirectResponse(url=redirect_url)