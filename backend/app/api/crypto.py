from fastapi import APIRouter, HTTPException
from app.models.schemas import EncryptRequest, DecryptRequest
from app.services.crypto_service import CryptoService

router = APIRouter(prefix="/crypto", tags=["crypto"])

@router.post("/encrypt")
async def encrypt_message(request: EncryptRequest):
    try:
        encrypted = CryptoService.encrypt_message(request.message, request.public_key)
        return {"encrypted_message": encrypted}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/decrypt")
async def decrypt_message(request: DecryptRequest):
    try:
        decrypted = CryptoService.decrypt_message(request.encrypted_message, request.private_key)
        return {"message": decrypted}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
