from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import HealthCheck
from routers import feed, swipe, saved, connections
from database import close_connection

app = FastAPI(
    title="ArxiSwipe Backend",
    description="Tinder-style research paper recommender API",
    version="1.0.0"
)

# Add CORS middleware (allow all origins for demo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(feed.router)
app.include_router(swipe.router)
app.include_router(saved.router)
app.include_router(connections.router)

@app.get("/", response_model=HealthCheck)
async def health_check():
    """Health check endpoint."""
    return HealthCheck(status="ok")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown."""
    close_connection()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
