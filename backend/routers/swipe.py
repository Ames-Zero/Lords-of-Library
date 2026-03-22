from fastapi import APIRouter
from datetime import datetime
from database import get_swipes_collection, get_saved_collection, get_papers_collection, get_bandit_collection
from models import SwipeRequest, SwipeResponse
from config import DEMO_USER
from recommender.linucb import load_state, get_feature_vector, update, save_state

router = APIRouter(prefix="/swipe", tags=["swipe"])

@router.post("")
async def log_swipe(request: SwipeRequest):
    """
    Log a swipe action and update LinUCB state.
    If direction is 'right', also save to saved_papers.
    """
    swipes_collection = get_swipes_collection()
    saved_collection = get_saved_collection()
    papers_collection = get_papers_collection()
    
    # Insert swipe event
    swipe_doc = {
        "user_id": DEMO_USER,
        "paper_id": request.paper_id,
        "direction": request.direction,
        "timestamp": datetime.now()
    }
    swipes_collection.insert_one(swipe_doc)
    
    # If right swipe, save to saved_papers
    if request.direction == "right":
        saved_collection.update_one(
            {"user_id": DEMO_USER, "paper_id": request.paper_id},
            {
                "$set": {
                    "user_id": DEMO_USER,
                    "paper_id": request.paper_id,
                    "saved_at": datetime.now()
                }
            },
            upsert=True
        )
    
    # Load LinUCB state
    A, b, alpha = load_state(None)
    
    # Fetch paper and compute feature vector
    paper = papers_collection.find_one({"_id": request.paper_id})
    if paper:
        feature_vec = get_feature_vector(paper)
        
        # Determine reward (1 for right, 0 for left)
        reward = 1 if request.direction == "right" else 0
        
        # Update LinUCB state
        A_updated, b_updated = update(A, b, feature_vec, reward)
        
        # Save updated state
        save_state(None, A_updated, b_updated)
    
    return SwipeResponse(status="ok")
