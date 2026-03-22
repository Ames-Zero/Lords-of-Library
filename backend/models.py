from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional
from datetime import datetime

class SwipeRequest(BaseModel):
    """Request body for POST /swipe endpoint."""
    paper_id: str
    direction: Literal["left", "right"]

class PaperOut(BaseModel):
    """Response model for paper metadata."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=lambda x: ''.join(['_'+c if c.isupper() else c for c in x]).lstrip('_'))
    
    id: str = None
    title: str = None
    abstract: str = None
    authors: list[str] = None
    primary_category: str = Field(None, alias="primaryCategory")
    categories: list[str] = None
    published_at: Optional[datetime] = Field(None, alias="publishedAt")
    arxiv_url: str = Field(None, alias="arxivUrl")
    pdf_url: str = Field(None, alias="pdfUrl")

class SavedPaperOut(PaperOut):
    """Response model for saved papers with timestamp."""
    saved_at: Optional[datetime] = Field(None, alias="savedAt")

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
