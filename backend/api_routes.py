from fastapi import APIRouter, HTTPException
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

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

@router.get("/api/users/count")
async def get_users_count():
    """Endpoint do pobierania liczby zarejestrowanych użytkowników"""
    try:
        conn = await get_db_connection()
        try:
            result = await conn.fetchval('SELECT COUNT(*) FROM user_ids')
            return {"count": result}
        finally:
            await conn.close()
    except Exception as e:
        print(f"Error fetching user count: {e}")
        raise HTTPException(status_code=500, detail="Database error")