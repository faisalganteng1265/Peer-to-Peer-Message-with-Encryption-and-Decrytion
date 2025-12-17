from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: str
    username: str
    email: str
    public_key: Optional[str] = None
    created_at: Optional[datetime] = None

class MessageCreate(BaseModel):
    receiver_id: str
    encrypted_content: str

class Message(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    encrypted_content: str
    created_at: datetime
    is_read: bool = False

class KeyPairResponse(BaseModel):
    public_key: str
    private_key: str

class EncryptRequest(BaseModel):
    message: str
    public_key: str

class DecryptRequest(BaseModel):
    encrypted_message: str
    private_key: str
