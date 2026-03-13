from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import os
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Load the trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ai-models", "risk_model.joblib")
try:
    model = joblib.load(MODEL_PATH)
    logger.info("Risk model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load risk model: {e}")
    model = None

class RiskPredictionRequest(BaseModel):
    latitude: float = Field(..., description="Latitude of the location")
    longitude: float = Field(..., description="Longitude of the location")
    is_night: int = Field(..., description="1 if night, 0 if day")

class RiskPredictionResponse(BaseModel):
    risk_score: float
    risk_level: str

@router.post("/", response_model=RiskPredictionResponse)
async def predict_risk(request: RiskPredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Risk model is currently unavailable.")
    
    try:
        # Prepare input data matching the training format: [['latitude', 'longitude', 'is_night']]
        input_df = pd.DataFrame([{
            "latitude": request.latitude,
            "longitude": request.longitude,
            "is_night": request.is_night
        }])
        
        # Predict using the loaded model
        prediction = model.predict(input_df)[0]
        
        # Determine risk level category
        if prediction >= 75:
            level = "CRITICAL"
        elif prediction >= 50:
            level = "HIGH"
        elif prediction >= 25:
            level = "MEDIUM"
        else:
            level = "LOW"
            
        return RiskPredictionResponse(
            risk_score=round(float(prediction), 2),
            risk_level=level
        )
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during prediction.")
