"""
NEPSE Stock Dashboard V2 - FastAPI Backend Entry Point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.api import auth, stocks, stocks_api, portfolio, floorsheet, data, predict

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print("Starting NEPSE Stock Dashboard API...")
    init_db()
    print("Database initialized.")

    # Start background data scheduler
    from app.core.scheduler import start_scheduler

    start_scheduler()
    print("Data scheduler started.")

    yield
    # Shutdown
    print("Shutting down...")
    from app.core.scheduler import stop_scheduler

    stop_scheduler()


# Create FastAPI app
app = FastAPI(
    title="NEPSE Stock Dashboard API",
    description="Backend API for NEPSE Stock Dashboard V2",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(stocks.router, prefix="/api")
app.include_router(stocks_api.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
app.include_router(floorsheet.router, prefix="/api")
app.include_router(data.router, prefix="/api")
app.include_router(predict.router, prefix="/api")


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "name": "NEPSE Stock Dashboard API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}


# Entry point for uvicorn
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
