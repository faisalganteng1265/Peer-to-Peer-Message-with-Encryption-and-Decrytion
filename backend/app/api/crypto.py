from fastapi import APIRouter, HTTPException
from app.models.schemas import EncryptRequest, DecryptRequest
from app.services.crypto_service import CryptoService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/crypto", tags=["crypto"])

@router.post("/encrypt")
async def encrypt_message(request: EncryptRequest):
    try:
        logger.info(f"API: Encrypt request received")
        encrypted = CryptoService.encrypt_message(request.message, request.public_key)
        logger.info(f"API: Encrypt request completed successfully")
        return {"encrypted_message": encrypted}
    except Exception as e:
        logger.error(f"API: Encrypt request failed - {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/decrypt")
async def decrypt_message(request: DecryptRequest):
    try:
        logger.info(f"API: Decrypt request received")
        decrypted = CryptoService.decrypt_message(request.encrypted_message, request.private_key)
        logger.info(f"API: Decrypt request completed successfully")
        return {"message": decrypted}
    except Exception as e:
        logger.error(f"API: Decrypt request failed - {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
