from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime

class SwipeRequest(BaseModel):
    """Request body for POST /swipe endpoint."""
    paper_id: str
    direction: Literal["left", "right"]

class PaperOut(BaseModel):
    """Response model for paper metadata."""
    id: str = None
    title: str = None
    abstract: str = None
    authors: list[str] = None
    primary_category: str = None
    categories: list[str] = None
    published_at: Optional[datetime] = None
    arxiv_url: str = None
    pdf_url: str = None

    class Config:
        from_attributes = True

class SavedPaperOut(PaperOut):
    """Response model for saved papers with timestamp."""
    saved_at: Optional[datetime] = None

class ConnectionOut(BaseModel):
    """Response model for connection/user profile."""
    name: str
    bio: str
    topics: list[str]

class HealthCheck(BaseModel):
    """Response model for health check."""
    status: str

class SwipeResponse(BaseModel):
    """Response model for swipe endpoint."""
    status: str
