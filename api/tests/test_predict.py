import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add parent dir to path so we can import api
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "NCTIRS AI-Backend"}

def test_risk_prediction():
    # Test valid payload
    payload = {
        "latitude": -1.2921, # Nairobi coords
        "longitude": 36.8219,
        "is_night": 1
    }
    response = client.post("/api/v1/predict/", json=payload)
    
    # Check if the model is available or unavailable
    # The endpoint might return 503 if risk_model.joblib is not trained yet
    if response.status_code == 200:
        data = response.json()
        assert "risk_score" in data
        assert "risk_level" in data
        assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert 0.0 <= data["risk_score"] <= 100.0
    else:
        assert response.status_code == 503
        assert response.json()["detail"] == "Risk model is currently unavailable."

def test_risk_prediction_validation():
    # Test missing fields
    payload = {
        "latitude": -1.2921
    }
    response = client.post("/api/v1/predict/", json=payload)
    assert response.status_code == 422 # Unprocessable Entity (FastAPI validation)
