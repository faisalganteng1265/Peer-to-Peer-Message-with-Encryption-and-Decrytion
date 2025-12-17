from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import UserCreate, UserLogin, User, KeyPairResponse
from app.core.database import get_db
from app.services.crypto_service import CryptoService
import bcrypt

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
async def register(user: UserCreate):
    db = get_db()

    existing = db.table("users").select("*").eq("email", user.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())

    keys = CryptoService.generate_key_pair()

    result = db.table("users").insert({
        "username": user.username,
        "email": user.email,
        "password": hashed_password.decode('utf-8'),
        "public_key": keys["public_key"]
    }).execute()

    return {
        "user": result.data[0],
        "private_key": keys["private_key"]
    }

@router.post("/login")
async def login(credentials: UserLogin):
    db = get_db()

    result = db.table("users").select("*").eq("email", credentials.email).execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = result.data[0]

    if not bcrypt.checkpw(credentials.password.encode('utf-8'), user["password"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "public_key": user["public_key"]
        }
    }

@router.post("/generate-keys", response_model=KeyPairResponse)
async def generate_keys():
    keys = CryptoService.generate_key_pair()
    return keys
