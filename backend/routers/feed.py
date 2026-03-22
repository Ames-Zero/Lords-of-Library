from fastapi import APIRouter
from database import get_papers_collection, get_swipes_collection
from recommender.linucb import load_state, score_papers
from models import PaperOut
from config import DEMO_USER
from utils import expand_category, expand_categories

router = APIRouter(prefix="/feed", tags=["feed"])

@router.get("/next", response_model=list[PaperOut])
async def get_next_papers():
    """
    Get next 20 papers for the user based on LinUCB scoring.
    Excludes papers already swiped.
    """
    # Load LinUCB state
    A, b, alpha = load_state(None)
    
    # Fetch all papers
    papers_collection = get_papers_collection()
    all_papers = list(papers_collection.find({}))
    
    # Get already swiped paper IDs
    swipes_collection = get_swipes_collection()
    swiped_ids = set()
    swiped_docs = swipes_collection.find({"user_id": DEMO_USER})
    for doc in swiped_docs:
        swiped_ids.add(doc["paper_id"])
    
    # Filter out swiped papers
    candidate_papers = [p for p in all_papers if p["_id"] not in swiped_ids]
    
    # Score papers
    scored_papers = score_papers(candidate_papers, A, b, alpha)
    
    # Get top 20
    top_20_ids = [paper_id for paper_id, _ in scored_papers[:20]]
    
    # Fetch full paper details for top 20
    result_papers = []
    for paper_id in top_20_ids:
        paper = papers_collection.find_one({"_id": paper_id})
        if paper:
            result_papers.append(PaperOut(
                id=paper["_id"],
                title=paper.get("title"),
                abstract=paper.get("abstract"),
                authors=paper.get("authors", []),
                primary_category=expand_category(paper.get("primary_category")),
                categories=expand_categories(paper.get("categories", [])),
                published_at=paper.get("published_at"),
                arxiv_url=paper.get("arxiv_url"),
                pdf_url=paper.get("pdf_url")
            ))
    
    return result_papers
