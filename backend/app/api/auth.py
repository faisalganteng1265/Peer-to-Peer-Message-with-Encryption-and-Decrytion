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

    # Encrypt private key with user's password
    encrypted_private_key = CryptoService.encrypt_private_key(keys["private_key"], user.password)

    result = db.table("users").insert({
        "username": user.username,
        "email": user.email,
        "password": hashed_password.decode('utf-8'),
        "public_key": keys["public_key"],
        "encrypted_private_key": encrypted_private_key
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

    # Decrypt private key using user's password
    private_key = None
    if user.get("encrypted_private_key"):
        try:
            private_key = CryptoService.decrypt_private_key(user["encrypted_private_key"], credentials.password)
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to decrypt private key")

    return {
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "public_key": user["public_key"]
        },
        "private_key": private_key
    }

@router.post("/generate-keys", response_model=KeyPairResponse)
async def generate_keys():
    keys = CryptoService.generate_key_pair()
    return keys

@router.post("/regenerate-keys/{user_id}")
async def regenerate_keys(user_id: str, password: str):
    """Regenerate keys for existing users who don't have encrypted_private_key"""
    db = get_db()

    # Get user
    result = db.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = result.data[0]

    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid password")

    # Generate new key pair
    keys = CryptoService.generate_key_pair()

    # Encrypt private key with user's password
    encrypted_private_key = CryptoService.encrypt_private_key(keys["private_key"], password)

    # Update user with new keys
    db.table("users").update({
        "public_key": keys["public_key"],
        "encrypted_private_key": encrypted_private_key
    }).eq("id", user_id).execute()

    return {
        "message": "Keys regenerated successfully",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "public_key": keys["public_key"]
        },
        "private_key": keys["private_key"]
    }
