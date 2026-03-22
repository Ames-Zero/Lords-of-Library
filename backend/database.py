from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from config import MONGO_URI, DB_NAME

_client = None
_db = None

def get_client():
    """Get or create MongoDB client."""
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
        # Verify connection
        try:
            _client.admin.command('ping')
        except Exception as e:
            print(f"MongoDB connection error: {e}")
            raise
    return _client

def get_db():
    """Get database instance."""
    global _db
    if _db is None:
        _db = get_client()[DB_NAME]
    return _db

def get_papers_collection():
    """Get papers collection."""
    return get_db()["papers"]

def get_swipes_collection():
    """Get swipes collection."""
    return get_db()["swipes"]

def get_saved_collection():
    """Get saved papers collection."""
    return get_db()["saved_papers"]

def get_bandit_collection():
    """Get bandit state collection."""
    return get_db()["bandit_state"]

def close_connection():
    """Close MongoDB connection."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
