import numpy as np
from datetime import datetime, timedelta
from config import FEATURE_DIM, DEMO_USER, DEFAULT_ALPHA, CATEGORIES
from database import get_bandit_collection

def load_state(db):
    """
    Load LinUCB state from MongoDB.
    If no state exists, initialize with identity matrix and zero vector.
    Returns: (A, b, alpha) where A is (d,d), b is (d,), alpha is scalar
    """
    bandit_collection = get_bandit_collection()
    doc = bandit_collection.find_one({"_id": DEMO_USER})
    
    if doc is None:
        # Initialize new state
        A = np.eye(FEATURE_DIM)
        b = np.zeros(FEATURE_DIM)
        alpha = DEFAULT_ALPHA
        
        # Save to MongoDB
        bandit_collection.insert_one({
            "_id": DEMO_USER,
            "A": A.tolist(),
            "b": b.tolist(),
            "alpha": alpha,
            "feature_dim": FEATURE_DIM
        })
    else:
        A = np.array(doc["A"])
        b = np.array(doc["b"])
        alpha = doc.get("alpha", DEFAULT_ALPHA)
    
    return A, b, alpha

def save_state(db, A, b):
    """
    Save updated LinUCB state to MongoDB.
    """
    bandit_collection = get_bandit_collection()
    bandit_collection.update_one(
        {"_id": DEMO_USER},
        {
            "$set": {
                "A": A.tolist(),
                "b": b.tolist()
            }
        }
    )

def get_feature_vector(paper):
    """
    Build feature vector from paper metadata.
    Features (d=8):
    - 4 dims: one-hot category encoding (cs.CL, cs.LG, cs.AI, stat.ML)
    - 1 dim: recency score = 1 / (1 + days_since_published)
    - 3 dims: title length one-hot (short/medium/long)
    """
    x = np.zeros(FEATURE_DIM)
    
    # 1. Category one-hot (first 4 dims)
    primary_category = paper.get("primary_category", "cs.CL")
    if primary_category in CATEGORIES:
        idx = CATEGORIES.index(primary_category)
        x[idx] = 1.0
    else:
        x[0] = 1.0  # default to cs.CL
    
    # 2. Recency (dim 4)
    published_at = paper.get("published_at")
    if isinstance(published_at, str):
        try:
            published_at = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
        except:
            published_at = datetime.now()
    elif not isinstance(published_at, datetime):
        published_at = datetime.now()
    
    days_since = (datetime.now() - published_at).days
    recency = 1.0 / (1.0 + max(0, days_since))
    x[4] = recency
    
    # 3. Title length bucket one-hot (dims 5-7)
    title = paper.get("title", "")
    word_count = len(title.split())
    
    if word_count < 8:
        x[5] = 1.0  # short
    elif word_count <= 15:
        x[6] = 1.0  # medium
    else:
        x[7] = 1.0  # long
    
    return x

def score_papers(papers, A, b, alpha):
    """
    Compute LinUCB scores for papers.
    Score = theta.T @ x + alpha * sqrt(x.T @ A_inv @ x)
    Returns list of (paper_id, score) tuples sorted by score descending.
    """
    try:
        A_inv = np.linalg.inv(A)
    except np.linalg.LinAlgError:
        # If A is singular, use pseudoinverse
        A_inv = np.linalg.pinv(A)
    
    theta = A_inv @ b
    
    scored_papers = []
    for paper in papers:
        x = get_feature_vector(paper)
        
        # Compute score
        exploration = alpha * np.sqrt(x.T @ A_inv @ x)
        exploitation = theta.T @ x
        score = exploitation + exploration
        
        scored_papers.append((paper["_id"], score))
    
    # Sort by score descending
    scored_papers.sort(key=lambda p: p[1], reverse=True)
    return scored_papers

def update(A, b, feature_vec, reward):
    """
    Update LinUCB state based on swipe feedback.
    A = A + outer(x, x)
    b = b + reward * x
    
    Args:
        A: (d, d) matrix
        b: (d,) vector
        feature_vec: (d,) feature vector
        reward: 1 for right swipe, 0 for left swipe
    
    Returns:
        Updated (A, b) tuple
    """
    A_updated = A + np.outer(feature_vec, feature_vec)
    b_updated = b + reward * feature_vec
    
    return A_updated, b_updated
