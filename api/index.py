import os
import asyncio
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
import numpy as np
import joblib
from textblob import TextBlob
from api.utils.ably_handler import ably_handler

app = FastAPI()

# --- Shield-Core Security Protocols ---
NCTIRS_INTERNAL_SECRET = os.getenv("NCTIRS_INTERNAL_SECRET", "SHADOW-CORE-ALPHA-99")

async def verify_nctirs_secret(x_nctirs_secret: str = Header(None)):
    if x_nctirs_secret != NCTIRS_INTERNAL_SECRET:
        raise HTTPException(status_code=403, detail="SHIELD-CORE: Access Denied. Invalid Internal Secret.")
    return x_nctirs_secret

# --- Elite Cyber Security AI Engine (NCTIRS v3.0) ---

class CyberRiskRequest(BaseModel):
    port_activity: float          # 0-1
    failed_logins: float          # 0-1
    traffic_entropy: float        # 0-1
    payload_size: float           # 0-1
    actor_persistence: float      # 0-1 (Elite)
    infra_criticality: float      # 0-1 (Elite)
    geopolitical_tension: float   # 0-1 (Elite)
    is_business_hours: int        # 0 or 1

class TrafficRequest(BaseModel):
    pcap_id: str
    packet_count: int
    data_points: List[float]

# AURA: Automated Universal Risk Attribution Engine
APT_PROFILES = {
    "APT28 (Fancy Bear)": {"vectors": ["PHISHING", "ZERO_DAY"], "persistence": 0.85},
    "Lazarus Group": {"vectors": ["DDOS", "RANSOMWARE"], "persistence": 0.92},
    "APT41 (Double Dragon)": {"vectors": ["DATA_EXFIL", "ZERO_DAY"], "persistence": 0.88},
    "ZINC-24": {"vectors": ["APT", "DATA_EXFIL"], "persistence": 0.95}
}

def attribute_threat(request: CyberRiskRequest, score: float):
    if score < 40: return "Unknown/Low Profile"
    
    # Heuristic Attribution
    if request.actor_persistence > 0.9 and request.infra_criticality > 0.8:
        return "ZINC-24 (Nation-State Actor)"
    if request.traffic_entropy > 0.8 and request.payload_size > 0.7:
        return "APT41 (Exfiltration Specialist)"
    if request.failed_logins > 0.7:
        return "Lazarus Group (Destructive Operations)"
    
    return "Generic Advanced Persistent Threat"

# Helper to load the Cyber model
def get_cyber_model():
    model_path = os.path.join(os.path.dirname(__file__), 'ai-models/risk_model.joblib')
    if os.path.exists(model_path):
        try:
            return joblib.load(model_path)
        except Exception as e:
            print(f"Error loading model: {e}")
    return None

@app.get("/")
def read_root():
    return {
        "status": "NCTIRS Elite SIGINT Engine Online", 
        "version": "3.0.0-elite",
        "capabilities": ["Elite Risk Prediction", "AURA Attribution", "Strategic Geopolitical Analysis"]
    }

@app.post("/predict/cyber-risk")
async def predict_cyber_risk(request: CyberRiskRequest, secret: str = Depends(verify_nctirs_secret)):
    model = get_cyber_model()
    if not model:
        raise HTTPException(status_code=500, detail="Elite Neural Core not found")
    
    # Prepare features for the ensemble (Must match training order)
    features = np.array([[
        request.port_activity,
        request.failed_logins,
        request.traffic_entropy,
        request.payload_size,
        request.actor_persistence,
        request.infra_criticality,
        request.geopolitical_tension,
        request.is_business_hours
    ]])
    
    impact_score = model.predict(features)[0]
    attribution = attribute_threat(request, impact_score)
    
    risk_level = "LOW"
    if impact_score > 85: risk_level = "CRITICAL"
    elif impact_score > 65: risk_level = "HIGH"
    elif impact_score > 40: risk_level = "MEDIUM"
    
    # Emit Tactical Ably Alert
    if impact_score > 50:
        asyncio.create_task(ably_handler.publish_alert("nctirs-alerts", "elite-threat-detected", {
            "score": float(impact_score),
            "level": risk_level,
            "attribution": attribution,
            "tactical_alert": True,
            "timestamp": datetime.now().isoformat()
        }))
        
    return {
        "impact_score": float(impact_score),
        "level": risk_level,
        "attribution": attribution,
        "strategic_advice": "Initiate Protocol BLACK-HORIZON" if risk_level == "CRITICAL" else "Monitor for SIGINT pulses",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/strategic/advise")
async def get_strategic_advice(threat_id: str, secret: str = Depends(verify_nctirs_secret)):
    # Simulated Strategic Advisory AI
    return {
        "threat_id": threat_id,
        "containment_strategy": [
            "Harden Edge Gateways in MOMBASA_EDGE",
            "Rotate SSL Certificates for NAIROBI_HUB",
            "Trigger Honeytoken traps on Database clusters"
        ],
        "geopolitical_impact": "High - Potential escalation in Cyber-Domain tensions",
        "advisory_code": "SIGINT-TACTICAL-ALPHA"
    }

@app.post("/analyze/traffic")
async def analyze_traffic(request: TrafficRequest, secret: str = Depends(verify_nctirs_secret)):
    data_array = np.array(request.data_points)
    anomaly_score = float(np.std(data_array) * (request.packet_count / 1000.0))
    is_threat = anomaly_score > 0.5
    
    return {
        "pcap_id": request.pcap_id,
        "anomaly_score": anomaly_score,
        "is_threat": is_threat,
        "classification": "NATION_STATE_SIGINT" if is_threat else "NORMAL_TRAFFIC"
    }
