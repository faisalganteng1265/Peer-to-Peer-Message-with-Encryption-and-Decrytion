from fastapi import APIRouter, HTTPException
from app.core.database import get_db
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
async def get_users(current_user_id: str = None):
    db = get_db()

    query = db.table("users").select("id, username, email, public_key, created_at")

    if current_user_id:
        query = query.neq("id", current_user_id)

    result = query.execute()
    return result.data

@router.get("/{user_id}")
async def get_user(user_id: str):
    db = get_db()

    result = db.table("users")\
        .select("id, username, email, public_key, created_at")\
        .eq("id", user_id)\
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data[0]

@router.get("/search/{query}")
async def search_users(query: str, current_user_id: str = None):
    db = get_db()

    result = db.table("users")\
        .select("id, username, email, public_key")\
        .ilike("username", f"%{query}%")\
        .execute()

    users = result.data
    if current_user_id:
        users = [u for u in users if u["id"] != current_user_id]

    return users
