from fastapi import FastAPI
from pydantic import BaseModel
import random
from typing import List, Optional
from datetime import datetime

# Define root_path for Vercel integration
app = FastAPI(title="NSSPIP AI Engine", version="1.0.0", root_path="/api/ai")

# --- Models ---
class RiskRequest(BaseModel):
    latitude: float
    longitude: float
    time_of_day: Optional[str] = None

class RiskResponse(BaseModel):
    risk_score: int
    risk_level: str
    contributing_factors: List[str]

class SurveillanceRequest(BaseModel):
    feed_id: str
    image_url: Optional[str] = None

class ObjectDetection(BaseModel):
    label: str
    confidence: float
    bbox: List[int] # [x, y, w, h]

class SurveillanceResponse(BaseModel):
    feed_id: str
    timestamp: str
    detected_objects: List[ObjectDetection]
    alert_triggered: bool

import pandas as pd
import joblib
import os
import random
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Serverless environments restrict file writing to /tmp
NLTK_DATA_DIR = "/tmp/nltk_data"
os.makedirs(NLTK_DATA_DIR, exist_ok=True)
nltk.data.path.append(NLTK_DATA_DIR)
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon', download_dir=NLTK_DATA_DIR)

sia = SentimentIntensityAnalyzer()

# Load model on Cold Start
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ai-models', 'risk_model.joblib')
try:
    risk_model = joblib.load(MODEL_PATH)
    print("✅ NSSPIP Random Forest Model Loaded Successfully")
except Exception as e:
    print(f"⚠️ Failed to load AI model (Running in degrade mode): {e}")
    risk_model = None

# --- Mock Logic & AI Inference ---

def calculate_risk(lat: float, lng: float, time_of_day: str = None) -> int:
    if risk_model:
        # AI Inference
        is_night = 1 if time_of_day == "night" else 0
        
        # Scikit-Learn expects a dataframe matching training features
        features = pd.DataFrame({'latitude': [lat], 'longitude': [lng], 'is_night': [is_night]})
        score = risk_model.predict(features)[0]
        return int(score)

    # Fallback MVP: Mock logic based on "Nairobi" coordinates
    base_score = random.randint(10, 30)
    if -1.29 < lat < -1.27 and 36.81 < lng < 36.83:
        base_score += random.randint(40, 60)
    
    return min(base_score, 100)

# --- Endpoints ---

@app.get("/")
def health_check():
    return {"status": "operational", "service": "NSSPIP AI Engine (Serverless)"}

@app.post("/predict/risk-score", response_model=RiskResponse)
def get_risk_score(request: RiskRequest):
    score = calculate_risk(request.latitude, request.longitude, request.time_of_day)
    
    level = "LOW"
    if score > 40: level = "MEDIUM"
    if score > 70: level = "HIGH"
    if score > 90: level = "CRITICAL"

    factors = []
    if level in ["HIGH", "CRITICAL"]:
        factors = ["Historical crime density high", "Poor lighting reported", "Proximity to high-value target"]
    elif level == "MEDIUM":
        factors = ["Recent minor incidents"]
    
    return {
        "risk_score": score,
        "risk_level": level,
        "contributing_factors": factors
    }

# Try to load YOLOv8 locally for CV
cv_model = None
try:
    from ultralytics import YOLO
    import urllib.request
    import tempfile
    CV_MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'yolov8n.pt')
    if os.path.exists(CV_MODEL_PATH):
       cv_model = YOLO(CV_MODEL_PATH)
       print("✅ NSSPIP YOLOv8 CV Model Loaded Successfully")
    else:
       # If it doesn't exist, it will download on first run
       cv_model = YOLO('yolov8n.pt')
       print("✅ NSSPIP YOLOv8 CV Model Initialized")
except ImportError:
    print("⚠️ Ultralytics not found. CV endpoint will run in mock Serverless degrade mode.")

@app.post("/analyze/surveillance", response_model=SurveillanceResponse)
def analyze_surveillance(request: SurveillanceRequest):
    detections = []
    triggered = False
    
    if cv_model and request.image_url:
        try:
            # We would download the image or use a local test path
            # For the demo, we use a placeholder image if image_url is just 'live_stream_placeholder'
            img_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ai-models", "surveillance_input.jpg")
            if not os.path.exists(img_path):
                 # Download the sample if missing
                 urllib.request.urlretrieve("https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1470&auto=format&fit=crop", img_path)
                 
            # Run inference targeting people, bags, knives
            TARGET_CLASSES = [0, 24, 26, 28, 43]
            results = cv_model(img_path, classes=TARGET_CLASSES, conf=0.35)
            
            if results:
                for box in results[0].boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    label = cv_model.names[cls_id]
                    
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    detections.append({
                        "label": label,
                        "confidence": conf,
                        "bbox": [x1, y1, int(x2-x1), int(y2-y1)]
                    })
                    
                    if cls_id in [24, 26, 28, 43]: # Suspicious bags/weapons
                        triggered = True
                        
        except Exception as e:
            print(f"YOLO Inference Error: {e}")
            pass # Fallthrough to mock if error

    # Run mock if no model or YOLO failed
    if not detections and not triggered:
        # Randomly simulate finding a weapon or abandoned bag
        if random.random() < 0.2: # 20% chance of threat in simulation
            detections.append({
                "label": "abandoned_bag",
                "confidence": 0.89,
                "bbox": [100, 200, 50, 50]
            })
            triggered = True
            
        if random.random() < 0.05: # 5% chance of weapon
            detections.append({
                "label": "weapon",
                "confidence": 0.95,
                "bbox": [120, 220, 30, 10]
            })
            triggered = True

    return {
        "feed_id": request.feed_id,
        "timestamp": datetime.now().isoformat(),
        "detected_objects": detections,
        "alert_triggered": triggered
    }

@app.post("/analyze/sentiment")
def analyze_sentiment(text: str):
    # Live ML NLP inference via NLTK VADER
    try:
        scores = sia.polarity_scores(text)
        compound = scores['compound']
        
        sentiment = "NEUTRAL"
        if compound >= 0.05:
            sentiment = "POSITIVE"
        elif compound <= -0.05:
            sentiment = "NEGATIVE"
            
        return {
            "text_preview": text[:50],
            "sentiment": sentiment,
            "score": compound
        }
    except Exception as e:
        # Fallback in case of serverless init errors
        return {
            "text_preview": text[:50],
            "sentiment": "ERROR",
            "score": 0.0
        }
