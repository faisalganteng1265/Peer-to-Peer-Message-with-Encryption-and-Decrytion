from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, messages, crypto, users
from app.core.config import get_settings
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(name)s - %(message)s'
)

settings = get_settings()

app = FastAPI(title="P2P Encrypted Messaging API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(messages.router)
app.include_router(crypto.router)
app.include_router(users.router)

@app.get("/")
async def root():
    return {"message": "P2P Encrypted Messaging API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
