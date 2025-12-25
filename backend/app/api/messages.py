from fastapi import APIRouter, HTTPException
from app.models.schemas import MessageCreate, Message
from app.core.database import get_db
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/send")
async def send_message(message: MessageCreate, sender_id: str):
    logger.info(f"Sending encrypted message from {sender_id} to {message.receiver_id}")
    db = get_db()

    insert_data = {
        "sender_id": sender_id,
        "receiver_id": message.receiver_id,
        "encrypted_content": message.encrypted_content
    }

    if message.sender_encrypted_content:
        insert_data["sender_encrypted_content"] = message.sender_encrypted_content

    result = db.table("messages").insert(insert_data).execute()

    logger.info(f"Message sent successfully (ID: {result.data[0]['id']})")
    return result.data[0]

@router.get("/conversation/{user_id}")
async def get_conversation(user_id: str, current_user_id: str):
    logger.info(f"Fetching conversation between {current_user_id} and {user_id}")
    db = get_db()

    messages = db.table("messages")\
        .select("*")\
        .or_(f"and(sender_id.eq.{current_user_id},receiver_id.eq.{user_id}),and(sender_id.eq.{user_id},receiver_id.eq.{current_user_id})")\
        .order("created_at")\
        .execute()

    logger.info(f"Retrieved {len(messages.data)} messages")
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
