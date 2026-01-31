from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from config import get_settings

settings = get_settings()


class Database:
    client: Optional[AsyncIOMotorClient] = None
    
    
db = Database()


async def connect_to_mongo():
    """Connect to MongoDB"""
    db.client = AsyncIOMotorClient(settings.mongodb_url)
    print(f"Connected to MongoDB at {settings.mongodb_url}")
    
    # Create TTL index for auto-deletion of expired clips
    collection = db.client[settings.database_name].clips
    await collection.create_index("expires_at", expireAfterSeconds=0)
    print("TTL index created for automatic clip expiration")


async def close_mongo_connection():
    """Close MongoDB connection"""
    if db.client:
        db.client.close()
        print("MongoDB connection closed")


def get_database():
    """Get database instance"""
    return db.client[settings.database_name]
