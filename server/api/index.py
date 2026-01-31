"""
Vercel Serverless Function Entry Point
This file adapts the FastAPI app for Vercel's serverless environment
"""
import os
import sys

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone, timedelta
import random
import html
from typing import Optional
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings
from motor.motor_asyncio import AsyncIOMotorClient
from mangum import Mangum

# ============ Settings ============
class Settings(BaseSettings):
    environment: str = "production"
    mongodb_url: str = os.environ.get("MONGODB_URL", "")
    database_name: str = os.environ.get("DATABASE_NAME", "quickclip")
    allowed_origins: str = os.environ.get("ALLOWED_ORIGINS", "*")
    rate_limit_per_minute: int = int(os.environ.get("RATE_LIMIT_PER_MINUTE", "30"))
    max_text_length: int = 100000
    min_timer: int = 30
    max_timer: int = 600

    class Config:
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

# ============ Database ============
_client: Optional[AsyncIOMotorClient] = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_url)
    return _client


def get_database():
    return get_client()[settings.database_name]


# ============ Models ============
class ClipCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=100000, description="Text to share")
    timer: int = Field(..., ge=30, le=600, description="Timer in seconds (30-600)")

    @field_validator('text')
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        sanitized = ''.join(char for char in v if char == '\n' or char == '\t' or (ord(char) >= 32 and ord(char) != 127))
        return sanitized.strip()


class ClipResponse(BaseModel):
    code: str
    expires_at: datetime
    timer: int
    message: str = "Clip created successfully"


class ClipData(BaseModel):
    code: str
    text: str
    expires_at: datetime
    remaining_seconds: int


class ErrorResponse(BaseModel):
    detail: str


class HealthResponse(BaseModel):
    status: str
    message: str
    timestamp: datetime


# ============ Services ============
def generate_code(length: int = 6) -> str:
    """Generate a random code avoiding confusing characters"""
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(random.choice(chars) for _ in range(length))


async def create_clip(text: str, timer_seconds: int) -> dict:
    """Create a new clipboard entry"""
    db = get_database()
    collection = db.clips

    code = generate_code()
    while await collection.find_one({"code": code}):
        code = generate_code()

    now = datetime.utcnow()
    expires_at = now + timedelta(seconds=timer_seconds)

    clip_doc = {
        "code": code,
        "text": text,
        "timer": timer_seconds,
        "created_at": now,
        "expires_at": expires_at,
    }

    await collection.insert_one(clip_doc)

    return {
        "code": code,
        "expires_at": expires_at.replace(tzinfo=timezone.utc),
        "timer": timer_seconds,
    }


async def get_clip(code: str) -> Optional[dict]:
    """Retrieve a clipboard entry by code"""
    db = get_database()
    collection = db.clips

    clip = await collection.find_one({"code": code.upper()})

    if not clip:
        return None

    expires_at = clip["expires_at"]
    now = datetime.utcnow()

    if expires_at < now:
        await collection.delete_one({"code": code.upper()})
        return None

    remaining = (expires_at - now).total_seconds()

    return {
        "code": clip["code"],
        "text": clip["text"],
        "expires_at": expires_at.replace(tzinfo=timezone.utc),
        "remaining_seconds": max(0, int(remaining)),
    }


async def delete_clip(code: str) -> bool:
    """Delete a clipboard entry"""
    db = get_database()
    collection = db.clips
    result = await collection.delete_one({"code": code.upper()})
    return result.deleted_count > 0


# ============ FastAPI App ============
app = FastAPI(
    title="QuickClip API",
    description="A secure, time-limited clipboard sharing service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
)

# CORS
origins = settings.allowed_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred"},
    )


# ============ Routes ============
@app.get("/", response_model=HealthResponse)
async def root():
    return HealthResponse(
        status="healthy",
        message="QuickClip API is running",
        timestamp=datetime.now(timezone.utc),
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        message="QuickClip API is running",
        timestamp=datetime.now(timezone.utc),
    )


@app.post("/api/clips/", response_model=ClipResponse)
async def create_new_clip(clip: ClipCreate):
    """Create a new clipboard entry"""
    try:
        result = await create_clip(clip.text, clip.timer)
        return ClipResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/clips/{code}", response_model=ClipData)
async def get_clip_by_code(code: str):
    """Retrieve a clipboard entry by code"""
    if len(code) != 6:
        raise HTTPException(status_code=400, detail="Code must be 6 characters")

    clip = await get_clip(code)

    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found or expired")

    return ClipData(**clip)


@app.delete("/api/clips/{code}")
async def delete_clip_by_code(code: str):
    """Delete a clipboard entry"""
    if len(code) != 6:
        raise HTTPException(status_code=400, detail="Code must be 6 characters")

    deleted = await delete_clip(code)

    if not deleted:
        raise HTTPException(status_code=404, detail="Clip not found")

    return {"message": "Clip deleted successfully"}


# Vercel handler
handler = Mangum(app, lifespan="off")
