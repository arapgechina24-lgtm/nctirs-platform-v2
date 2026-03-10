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

# Feature engineering
lats = np.random.uniform(lat_min, lat_max, num_samples)
lngs = np.random.uniform(lng_min, lng_max, num_samples)

# Simulate "Hotspots" (CBD / High Crime density areas)
# CBD Approx: -1.282, 36.821
cbd_lat, cbd_lng = -1.282, 36.821
cbd_dist = np.sqrt((lats - cbd_lat)**2 + (lngs - cbd_lng)**2)

# Time of day mapping
# 0: Day, 1: Night
time_of_day_encoded = np.random.choice([0, 1], num_samples, p=[0.6, 0.4])

# Formulate base risk score (0-100)
# Proximity to CBD increases risk. Night increases risk.
base_risk = np.random.normal(30, 10, num_samples)

# Hotspot proximity multiplier (closer = higher score, max ~ +50)
proximity_penalty = np.clip(50 - (cbd_dist * 500), 0, 50)

# Night penalty (+20)
time_penalty = time_of_day_encoded * 20

# Final formulated labels
risk_scores = np.clip(base_risk + proximity_penalty + time_penalty, 0, 100)

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
