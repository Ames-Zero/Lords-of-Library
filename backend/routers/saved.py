from fastapi import APIRouter
from database import get_saved_collection, get_papers_collection
from models import SavedPaperOut
from config import DEMO_USER

router = APIRouter(prefix="/saved", tags=["saved"])

@router.get("", response_model=list[SavedPaperOut])
async def get_saved_papers():
    """
    Get all right-swiped (saved) papers for the user.
    Returns them sorted by save time descending.
    """
    saved_collection = get_saved_collection()
    papers_collection = get_papers_collection()
    
    # Query saved papers for demo_user, sorted by saved_at descending
    saved_docs = list(saved_collection.find(
        {"user_id": DEMO_USER}
    ).sort("saved_at", -1))
    
    result = []
    for saved_doc in saved_docs:
        paper = papers_collection.find_one({"_id": saved_doc["paper_id"]})
        if paper:
            result.append(SavedPaperOut(
                id=paper["_id"],
                title=paper.get("title"),
                abstract=paper.get("abstract"),
                authors=paper.get("authors", []),
                primary_category=paper.get("primary_category"),
                categories=paper.get("categories", []),
                published_at=paper.get("published_at"),
                arxiv_url=paper.get("arxiv_url"),
                pdf_url=paper.get("pdf_url"),
                saved_at=saved_doc.get("saved_at")
            ))
    
    return result
