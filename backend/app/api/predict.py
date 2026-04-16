"""
Prediction API endpoints.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/predict", tags=["Predictions"])


@router.get("/status")
def get_model_status():
    """Get ML model status."""
    import os
    from app.core.ml_model import MODEL_PATH

    if not os.path.exists(MODEL_PATH):
        return {"available": False, "message": "Model not trained yet"}

    model_time = os.path.getmtime(MODEL_PATH)
    from datetime import datetime

    trained_at = datetime.fromtimestamp(model_time).isoformat()

    return {"available": True, "trained_at": trained_at, "path": MODEL_PATH}


@router.post("/train")
def train_model_endpoint():
    """Manually trigger model training."""
    from app.core.ml_model import train_model as train

    model = train()
    if model is None:
        raise HTTPException(status_code=500, detail="Training failed")

    return {"status": "success", "message": "Model trained successfully"}


@router.get("/scheduler/status")
def get_ml_scheduler_status():
    """Get ML scheduler status."""
    from app.core.scheduler import get_ml_scheduler

    scheduler = get_ml_scheduler()
    return scheduler.get_status()


@router.get("/{symbol}")
def get_prediction(symbol: str):
    """Get ML prediction for a stock's next day price movement."""
    from app.core.ml_model import predict_next_day, load_model, train_if_needed

    # Ensure model is loaded
    model = load_model()
    if model is None:
        # Try to train
        model = train_if_needed()
        if model is None:
            raise HTTPException(
                status_code=503,
                detail="ML model not available. Please try again later.",
            )

    result = predict_next_day(symbol.upper())

    if result.get("error"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return result
