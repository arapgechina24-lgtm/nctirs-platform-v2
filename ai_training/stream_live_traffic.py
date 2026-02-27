"""
NCTIRS Live Data Streaming Script

Streams dataset records sequentially through the trained AI model, simulating
real-time network traffic. Detected anomalies are POSTed to the Next.js dashboard
via the `/api/threats` endpoint.
"""

import sys
import time
import json
import torch
import random
import requests
import datetime
import numpy as np
from pathlib import Path

# Add parent directory to path to absolute imports work properly if needed
sys.path.append(str(Path(__file__).parent))

from config import MODEL_CONFIG, CHECKPOINT_DIR, DATA_DIR, TRAIN_CONFIG
from model import build_model
from dataset_loader import DatasetLoader

# Dashboard API endpoint configuration
# Note: Next.js must be running at this URL
API_URL = "http://localhost:3000/api/threats"
# Note: You may need an admin token or to bypass RBAC on local dev for this to work natively
# We bypass the complex RBAC headers here assuming the API allows local dev insertion or
# we provide mock headers if required.

def get_threat_type(features_row, idx):
    """Simple heuristic to assign a category based on the row features or random for demo"""
    types = ["DDOS", "RANSOMWARE", "APT", "INSIDER", "DATA_EXFILTRATION", "ZERO_DAY", "MALWARE"]
    # Provide a reproducible but varied threat type
    np.random.seed(idx)
    return np.random.choice(types)

def get_target_sector():
    """Returns a random critical infrastructure sector in Kenya"""
    sectors = [
        "FINANCE", "ENERGY", "TELECOM", "GOVERNMENT", 
        "HEALTHCARE", "DEFENSE", "ELECTION_SYSTEMS"
    ]
    return random.choice(sectors)

def stream_traffic(dataset_choice="synthetic", delay=2.0, threshold=0.15):
    """
    Load the dataset, pass it through the model sequentially, and post alerts.
    
    Args:
        dataset_choice: "synthetic", "cicids", or "unsw"
        delay: seconds to wait between packets
        threshold: anomaly reconstruction error threshold
    """
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Initializing Live Threat Streamer...")
    
    # 1. Load the Model
    checkpoint_path = CHECKPOINT_DIR / "best_model.pt"
    if not checkpoint_path.exists():
        print(f"Error: Model checkpoint not found at {checkpoint_path}")
        return

    model = build_model(MODEL_CONFIG)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Loaded trained AI model (Epoch {checkpoint.get('epoch', 'N/A')}).")
    
    # 2. Load the Dataset
    loader = DatasetLoader(seq_len=MODEL_CONFIG["sequence_length"])
    
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Loading {dataset_choice} dataset...")
    if dataset_choice == "synthetic":
        features, labels = loader.load_synthetic()
    elif dataset_choice == "cicids":
        # Load the test file directly for demo purposes
        cicids_dir = DATA_DIR / "cicids2017" # Assumes dir exists
        csv_files = list(cicids_dir.glob("*.csv"))
        if not csv_files:
            print("No CICIDS CSV files found. Falling back to synthetic.")
            features, labels = loader.load_synthetic()
        else:
            features, labels = loader.load_cicids([str(csv_files[0])]) # Use just one for streaming
    else:
        features, labels = loader.load_synthetic()
        
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Starting stream of {len(features)} packets.")
    print(f"Target AP: {API_URL}")
    print(f"Delay: {delay}s | Anomaly Threshold: {threshold}")
    print("-" * 60)
    
    seq_len = MODEL_CONFIG["sequence_length"]
    
    # Create an initial random sequence to run through the model, simulating build-up
    current_window = [features[max(0, i)].tolist() for i in range(seq_len-1)]
    
    # Track statistics
    stats = {"processed": 0, "anomalies": 0, "posted": 0, "failed": 0}

    try:
        # Start streaming from index representing the end of the first window
        for i in range(seq_len - 1, len(features)):
            # 3. Build sequence window
            current_window.append(features[i].tolist())
            
            # Convert to tensor and add batch dimension (1, seq_len, features)
            window_tensor = torch.tensor([current_window], dtype=torch.float32).to(device)
            
            # 4. AI Inference
            with torch.no_grad():
                output_dict = model(window_tensor)
                reconstructed = output_dict["reconstruction"]  # The model returns a dictionary
                
            # Calculate Mean Squared Error (Reconstruction Loss)
            mse_loss = torch.nn.functional.mse_loss(reconstructed, window_tensor, reduction='none')
            # Average loss over features and sequence length for this sample
            anomaly_score = torch.mean(mse_loss).item()
            
            # Simulated ground truth label just for logging
            actual_label = labels[i]
            
            stats["processed"] += 1
            timestamp = datetime.datetime.now().strftime('%H:%M:%S')
            
            # 5. Detect Anomaly
            is_anomaly = anomaly_score > threshold
            
            if is_anomaly:
                stats["anomalies"] += 1
                confidence = min(99.9, max(50.0, (anomaly_score / (threshold * 2)) * 100))
                threat_type = get_threat_type(features[i], i)
                sector = get_target_sector()
                
                print(f"[{timestamp}] 🚨 ANOMALY SCORE: {anomaly_score:.4f} (Conf: {confidence:.1f}%) | {threat_type} -> {sector}")
                
                # 6. POST to Next.js API
                payload = {
                    "name": f"AI-Automated {threat_type} Detection",
                    "type": threat_type,
                    "severity": "CRITICAL" if confidence > 90 else "HIGH" if confidence > 75 else "MEDIUM",
                    "source": f"ATAE v3.2 Stream Monitor",
                    "targetSector": sector,
                    "confidence": confidence,
                    "description": f"AI sequence analysis detected anomalous network behavior with reconstruction loss of {anomaly_score:.4f}. Packet sequence deviating from baseline.",
                }
                
                try:
                    # In local dev environment, POST to the API. 
                    headers = {
                        'Content-Type': 'application/json',
                        'x-stream-token': 'NCTIRS_LOCAL_STREAM_SECRET_123'
                    }
                    response = requests.post(API_URL, json=payload, headers=headers)
                    
                    if response.status_code in [200, 201]:
                        stats["posted"] += 1
                        print(f"   ↳  ✅ Successfully posted to Dashboard (HTTP {response.status_code})")
                    elif response.status_code == 429:
                        print(f"   ↳  ⚠️ Rate limited by Dashboard API. Waiting 10s...")
                        time.sleep(10)
                    else:
                        stats["failed"] += 1
                        print(f"   ↳  ❌ Dashboard API Error: {response.status_code} - {response.text}")
                except Exception as e:
                    stats["failed"] += 1
                    print(f"   ↳  ❌ Network Request Failed: {str(e)}")
                    
            else:
                # Log benign traffic occasionally just to show it's working
                if i % 10 == 0:
                    print(f"[{timestamp}] 🟩 Normal Traffic | Score: {anomaly_score:.4f} | Queue length: {stats['processed']}")
            
            # Maintain sliding window size
            current_window.pop(0)
            
            # Wait before loading next packet to simulate real-time
            time.sleep(delay)

    except KeyboardInterrupt:
        print("\n" + "="*50)
        print("STREAM STOPPED BY USER")
        print("="*50)
    finally:
        print(f"Stream Summary: {stats['processed']} Processed | {stats['anomalies']} Dropped/Anomalous | {stats['posted']} Sent to DB")


if __name__ == "__main__":
    # You can change the parameters here. 
    # E.g., stream_traffic(dataset="cicids", delay=0.5, threshold=0.2)
    stream_traffic(dataset_choice="synthetic", delay=2.0, threshold=0.25)
