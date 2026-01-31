from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Literal
import secrets


class Settings(BaseSettings):
    # Environment
    environment: Literal["development", "production", "testing"] = "development"
    debug: bool = False
    
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "quickclip"
    
    # Security
    secret_key: str = secrets.token_urlsafe(32)
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    
    # Rate Limiting
    rate_limit_per_minute: int = 30
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    
    # Clip Settings
    max_text_length: int = 100000
    min_timer: int = 30
    max_timer: int = 600
    
    @property
    def is_production(self) -> bool:
        return self.environment == "production"
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
