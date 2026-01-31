from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import html


class ClipCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=100000, description="Text to share")
    timer: int = Field(..., ge=30, le=600, description="Timer in seconds (30-600)")
    
    @field_validator('text')
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        # Remove null bytes and other control characters (except newlines and tabs)
        sanitized = ''.join(char for char in v if char == '\n' or char == '\t' or (ord(char) >= 32 and ord(char) != 127))
        return sanitized.strip()


class ClipResponse(BaseModel):
    code: str
    expires_at: datetime
    timer: int
    message: str = "Clip created successfully"


class ClipRetrieve(BaseModel):
    code: str = Field(..., min_length=6, max_length=6, pattern="^[A-Z0-9]+$")


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
