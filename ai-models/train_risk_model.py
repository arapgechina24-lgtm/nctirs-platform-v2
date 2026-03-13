import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

print("NSSPIP AI: Generating Synthetic Geospatial Training Data...")

# Seed for reproducibility
np.random.seed(42)

# Generate 10,000 synthetic incidents
num_samples = 10000

# Nairobi approximate bounding box
lat_min, lat_max = -1.35, -1.20
lng_min, lng_max = 36.70, 36.95

# Define Realistic Nairobi Hotspots with unique risk profiles
# CBD: High density, higher petty crime, highest surveillance
# Kibera/Mathare: High density, varied risk modifiers
# Westlands: High-value targets, specific transit risks
# Eastleigh: Business hub, specific transit/congestion risk
HOTSPOTS = [
    {"name": "CBD", "lat": -1.2833, "lng": 36.8167, "base_risk": 45, "radius": 0.01},
    {"name": "Kibera", "lat": -1.3133, "lng": 36.7833, "base_risk": 55, "radius": 0.015},
    {"name": "Mathare", "lat": -1.2583, "lng": 36.8583, "base_risk": 58, "radius": 0.012},
    {"name": "Westlands", "lat": -1.2633, "lng": 36.8033, "base_risk": 35, "radius": 0.01},
    {"name": "Eastleigh", "lat": -1.2750, "lng": 36.8450, "base_risk": 50, "radius": 0.013}
]

# Feature engineering
lats = np.random.uniform(lat_min, lat_max, num_samples)
lngs = np.random.uniform(lng_min, lng_max, num_samples)

# Time of day mapping (0: Day, 1: Night)
time_of_day_encoded = np.random.choice([0, 1], num_samples, p=[0.6, 0.4])

# Formulate realistic risk scores
risk_scores = np.zeros(num_samples)

for i in range(num_samples):
    current_lat, current_lng = lats[i], lngs[i]
    is_night = time_of_day_encoded[i]
    
    # Base baseline
    score = np.random.normal(20, 5)
    
    # Calculate proximity to each hotspot
    for spot in HOTSPOTS:
        dist = np.sqrt((current_lat - spot["lat"])**2 + (current_lng - spot["lng"])**2)
        if dist < spot["radius"] * 3: # Influence zone
            # Gaussian-like risk falloff
            influence = np.exp(-(dist**2) / (2 * (spot["radius"]**2)))
            score += spot["base_risk"] * influence
    
    # Night penalty (escalates risk in hotspots)
    if is_night:
        score += 15
        # Night-time risk is higher in the CBD and Kibera specifically
        cbd_dist = np.sqrt((current_lat - (-1.2833))**2 + (current_lng - 36.8167)**2)
        if cbd_dist < 0.01:
            score += 20

    risk_scores[i] = np.clip(score, 0, 100)

df = pd.DataFrame({
    'latitude': lats,
    'longitude': lngs,
    'is_night': time_of_day_encoded,
    'risk_score': risk_scores
})

print(f"Synthesized {num_samples} records. Training Random Forest Regressor...")

# Split Data
X = df[['latitude', 'longitude', 'is_night']]
y = df['risk_score']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the model
model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
model.fit(X_train, y_train)

# Evaluate
predictions = model.predict(X_test)
mse = mean_squared_error(y_test, predictions)
r2 = r2_score(y_test, predictions)
print(f"Model Evaluation Metrics:\nMSE: {mse:.2f}\nR2 Score: {r2:.4f}")

# Export the Model
save_path = os.path.join(os.path.dirname(__file__), 'risk_model.joblib')
joblib.dump(model, save_path)
print(f"✅ Model successfully trained and saved to: {save_path}")

# Verify file size (Vercel serverless has a 250MB uncompressed limit)
size_mb = os.path.getsize(save_path) / (1024 * 1024)
print(f"Model Size: {size_mb:.2f} MB")
