import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MongoDB configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "arxiswipe")

# Demo user ID
DEMO_USER = "demo_user"

# LinUCB parameters
FEATURE_DIM = 8
DEFAULT_ALPHA = 1.0

# Categories for feature engineering
CATEGORIES = ["cs.CL", "cs.LG", "cs.AI", "stat.ML"]
