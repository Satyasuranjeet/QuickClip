from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from models import ClipCreate, ClipResponse, ClipRetrieve, ClipData, ErrorResponse
from services import create_clip, get_clip, delete_clip
from config import get_settings

settings = get_settings()
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/clips", tags=["clips"])


@router.post(
    "/",
    response_model=ClipResponse,
    responses={429: {"model": ErrorResponse}},
    summary="Create a new clip",
    description="Create a new clipboard entry with text and timer"
)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def create_new_clip(request: Request, clip: ClipCreate):
    """Create a new clipboard entry"""
    try:
        result = await create_clip(clip.text, clip.timer)
        return ClipResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{code}",
    response_model=ClipData,
    responses={404: {"model": ErrorResponse}, 429: {"model": ErrorResponse}},
    summary="Get a clip by code",
    description="Retrieve clipboard content using the 6-character code"
)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def get_clip_by_code(request: Request, code: str):
    """Retrieve a clipboard entry by code"""
    if len(code) != 6:
        raise HTTPException(status_code=400, detail="Code must be 6 characters")
    
    clip = await get_clip(code)
    
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found or expired")
    
    return ClipData(**clip)


@router.delete(
    "/{code}",
    responses={404: {"model": ErrorResponse}},
    summary="Delete a clip",
    description="Delete a clipboard entry before it expires"
)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def delete_clip_by_code(request: Request, code: str):
    """Delete a clipboard entry"""
    if len(code) != 6:
        raise HTTPException(status_code=400, detail="Code must be 6 characters")
    
    deleted = await delete_clip(code)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Clip not found")
    
    return {"message": "Clip deleted successfully"}
