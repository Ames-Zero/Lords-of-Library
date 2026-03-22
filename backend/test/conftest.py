"""
Pytest configuration and fixtures for backend tests.
Mocks MongoDB collections and provides FastAPI test client.
"""
import pytest
from unittest.mock import patch, MagicMock
from starlette.testclient import TestClient
from datetime import datetime
import numpy as np
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app
from config import DEMO_USER


# Mock paper data
MOCK_PAPERS = [
    {
        "_id": "paper_001",
        "title": "Deep Learning Fundamentals",
        "abstract": "An overview of deep learning techniques",
        "authors": ["John Smith", "Jane Doe"],
        "primary_category": "cs.LG",
        "categories": ["cs.LG", "cs.AI"],
        "published_at": datetime(2023, 1, 15),
        "arxiv_url": "https://arxiv.org/abs/2301.00001",
        "pdf_url": "https://arxiv.org/pdf/2301.00001.pdf",
        "title_len": 3,
        "recency": 0.8,
    },
    {
        "_id": "paper_002",
        "title": "Neural Networks for NLP",
        "abstract": "Application of neural networks in NLP tasks",
        "authors": ["Alice Johnson"],
        "primary_category": "cs.CL",
        "categories": ["cs.CL", "cs.LG"],
        "published_at": datetime(2023, 6, 20),
        "arxiv_url": "https://arxiv.org/abs/2306.00002",
        "pdf_url": "https://arxiv.org/pdf/2306.00002.pdf",
        "title_len": 2,
        "recency": 0.6,
    },
    {
        "_id": "paper_003",
        "title": "Computer Vision Advances",
        "abstract": "Recent advances in computer vision",
        "authors": ["Bob Wilson", "Carol Davis", "David Lee"],
        "primary_category": "cs.CV",
        "categories": ["cs.CV", "cs.AI"],
        "published_at": datetime(2023, 12, 1),
        "arxiv_url": "https://arxiv.org/abs/2312.00003",
        "pdf_url": "https://arxiv.org/pdf/2312.00003.pdf",
        "title_len": 2,
        "recency": 0.9,
    },
    {
        "_id": "paper_004",
        "title": "Reinforcement Learning: Theory and Practice",
        "abstract": "Comprehensive guide to RL methods",
        "authors": ["Emma Brown"],
        "primary_category": "cs.LG",
        "categories": ["cs.LG", "cs.AI", "stat.ML"],
        "published_at": datetime(2022, 9, 10),
        "arxiv_url": "https://arxiv.org/abs/2209.00004",
        "pdf_url": "https://arxiv.org/pdf/2209.00004.pdf",
        "title_len": 4,
        "recency": 0.2,
    },
    {
        "_id": "paper_005",
        "title": "Transformers and Attention",
        "abstract": "Understanding attention mechanisms",
        "authors": ["Frank Miller"],
        "primary_category": "cs.CL",
        "categories": ["cs.CL", "cs.LG"],
        "published_at": datetime(2023, 3, 5),
        "arxiv_url": "https://arxiv.org/abs/2303.00005",
        "pdf_url": "https://arxiv.org/pdf/2303.00005.pdf",
        "title_len": 2,
        "recency": 0.5,
    },
]

# Mock swipe data
MOCK_SWIPES = [
    {
        "user_id": DEMO_USER,
        "paper_id": "paper_001",
        "direction": "right",
        "timestamp": datetime.now(),
    }
]

# Mock bandit state
MOCK_BANDIT_STATE = {
    "_id": DEMO_USER,
    "A": np.eye(8).tolist(),
    "b": np.zeros(8).tolist(),
    "alpha": 1.0,
}


@pytest.fixture
def mock_database():
    """Create mock MongoDB collections - fresh for each test."""
    # Create fresh copies of mock data for each test
    mock_papers = {doc["_id"]: doc.copy() for doc in MOCK_PAPERS}
    mock_swipes = {}  # Start empty for each test
    mock_saved = {}   # Start empty for each test
    mock_bandit = {DEMO_USER: MOCK_BANDIT_STATE.copy()}

    class MockCollection:
        def __init__(self, data_dict):
            self.data = data_dict

        def find(self, query=None, sort_spec=None):
            if query is None:
                results = list(self.data.values())
            else:
                results = [doc for doc in self.data.values() if self._matches(doc, query)]
            
            if sort_spec:
                field, direction = sort_spec
                results.sort(key=lambda x: x.get(field, ""), reverse=(direction == -1))
            return results

        def find_one(self, query):
            for doc in self.data.values():
                if self._matches(doc, query):
                    return doc
            return None

        def insert_one(self, doc):
            doc_id = doc.get("_id", len(self.data))
            self.data[doc_id] = doc

        def update_one(self, query, update, upsert=False):
            found = False
            for doc in self.data.values():
                if self._matches(doc, query):
                    if "$set" in update:
                        doc.update(update["$set"])
                    found = True
                    break
            if not found and upsert and "$set" in update:
                doc_id = update["$set"].get("_id", update["$set"].get("paper_id", len(self.data)))
                self.data[doc_id] = update["$set"]

        def delete_many(self, query):
            to_delete = [key for key, doc in self.data.items() if self._matches(doc, query)]
            for key in to_delete:
                del self.data[key]

        @staticmethod
        def _matches(doc, query):
            for key, value in query.items():
                if key.startswith("$"):
                    continue
                if isinstance(value, dict):
                    if "$in" in value:
                        if doc.get(key) not in value["$in"]:
                            return False
                else:
                    if doc.get(key) != value:
                        return False
            return True

    return {
        "papers": MockCollection(mock_papers),
        "swipes": MockCollection(mock_swipes),
        "saved": MockCollection(mock_saved),
        "bandit": MockCollection(mock_bandit),
    }


@pytest.fixture
def client(mock_database):
    """Create FastAPI test client with mocked database."""
    
    def mock_get_papers_collection():
        return mock_database["papers"]

    def mock_get_swipes_collection():
        return mock_database["swipes"]

    def mock_get_saved_collection():
        return mock_database["saved"]

    def mock_get_bandit_collection():
        return mock_database["bandit"]

    with patch("database.get_papers_collection", mock_get_papers_collection), \
         patch("database.get_swipes_collection", mock_get_swipes_collection), \
         patch("database.get_saved_collection", mock_get_saved_collection), \
         patch("database.get_bandit_collection", mock_get_bandit_collection), \
         patch("database.close_connection"):
        
        # Use base_url parameter for compatibility with newer versions
        yield TestClient(app, base_url="http://test")


@pytest.fixture
def sample_paper():
    """Provide a sample paper for testing."""
    return MOCK_PAPERS[0]


@pytest.fixture
def sample_papers():
    """Provide all sample papers for testing."""
    return MOCK_PAPERS
