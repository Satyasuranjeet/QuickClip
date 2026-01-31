import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
from database import get_database


def generate_code(length: int = 6) -> str:
    """Generate a random code avoiding confusing characters"""
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(random.choice(chars) for _ in range(length))


async def create_clip(text: str, timer_seconds: int) -> dict:
    """Create a new clipboard entry"""
    db = get_database()
    collection = db.clips
    
    # Generate unique code
    code = generate_code()
    
    # Check if code already exists (rare but possible)
    while await collection.find_one({"code": code}):
        code = generate_code()
    
    # Use naive UTC datetime for MongoDB compatibility
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
    
    # MongoDB stores naive datetimes, so we compare with naive UTC datetime
    expires_at = clip["expires_at"]
    now = datetime.utcnow()
    
    # Check if expired (double check, TTL index should handle this)
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
