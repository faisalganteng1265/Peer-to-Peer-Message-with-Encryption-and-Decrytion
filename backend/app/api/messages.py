from fastapi import APIRouter, HTTPException
from app.models.schemas import MessageCreate, Message
from app.core.database import get_db
from typing import List

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/send")
async def send_message(message: MessageCreate, sender_id: str):
    db = get_db()

    result = db.table("messages").insert({
        "sender_id": sender_id,
        "receiver_id": message.receiver_id,
        "encrypted_content": message.encrypted_content
    }).execute()

    return result.data[0]

@router.get("/conversation/{user_id}")
async def get_conversation(user_id: str, current_user_id: str):
    db = get_db()

    messages = db.table("messages")\
        .select("*")\
        .or_(f"and(sender_id.eq.{current_user_id},receiver_id.eq.{user_id}),and(sender_id.eq.{user_id},receiver_id.eq.{current_user_id})")\
        .order("created_at")\
        .execute()

    return messages.data

@router.get("/inbox/{user_id}")
async def get_inbox(user_id: str):
    db = get_db()

    messages = db.table("messages")\
        .select("*")\
        .eq("receiver_id", user_id)\
        .order("created_at", desc=True)\
        .execute()

    return messages.data

@router.put("/{message_id}/read")
async def mark_as_read(message_id: str):
    db = get_db()

    result = db.table("messages")\
        .update({"is_read": True})\
        .eq("id", message_id)\
        .execute()

    return result.data[0]
