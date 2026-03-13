import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, VotingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

print("NCTIRS AI: Generating Cyber Security Synthetic Training Data...")

# Seed for reproducibility
np.random.seed(42)

# Generate 15,000 synthetic cyber telemetry samples
num_samples = 15000

# Feature Generation
# 1. Port Activity (Scaled 0-1) - High means scanning or unusual port usage
port_activity = np.random.uniform(0, 1, num_samples)

# 2. Failed Logins (Internal/External) - High means brute force attempt
failed_logins = np.random.poisson(2, num_samples) / 20.0 

# 3. Traffic Entropy (0-1) - High means encrypted exfiltration or C2 traffic
traffic_entropy = np.random.uniform(0.2, 0.8, num_samples)

# elite intelligence features
# 1. actor_persistence: complexity of the threat actor (Nation State vs Script Kiddie)
# 2. infra_criticality: importance of the targeted node
# 3. temporal_risk: risk based on global geopolitical events/time

def generate_elite_cyber_data(n_samples=5000):
    np.random.seed(42)
    
    # Existing features
    port_activity = np.random.rand(n_samples) # 0 to 1
    failed_logins = np.random.rand(n_samples) # 0 to 1
    traffic_entropy = np.random.rand(n_samples) # 0 to 1
    payload_size = np.random.rand(n_samples) # 0 to 1
    is_business_hours = np.random.randint(0, 2, n_samples)
    
    # Elite Features
    actor_persistence = np.random.rand(n_samples) # 0 to 1 (0.9+ = Nation State)
    infra_criticality = np.random.rand(n_samples) # 0 to 1 (0.8+ = Critical Infrastructure)
    geopolitical_tension = np.random.rand(n_samples) # 0 to 1
    
    # Target: Threat Impact Score (0 to 100)
    # Impact increases with persistence and criticality
    impact_score = (
        (port_activity * 15) + 
        (failed_logins * 20) + 
        (traffic_entropy * 25) + 
        (payload_size * 10) + 
        (actor_persistence * 30) + 
        (infra_criticality * 40) +
        (geopolitical_tension * 10) -
        (is_business_hours * 5) # Stealthier outside business hours, but less impact?
    )
    
    # Normalize to 0-100
    impact_score = (impact_score - impact_score.min()) / (impact_score.max() - impact_score.min()) * 100
    # Add noise
    impact_score += np.random.normal(0, 2, n_samples)
    impact_score = np.clip(impact_score, 0, 100)
    
    data = pd.DataFrame({
        'port_activity': port_activity,
        'failed_logins': failed_logins,
        'traffic_entropy': traffic_entropy,
        'payload_size': payload_size,
        'actor_persistence': actor_persistence,
        'infra_criticality': infra_criticality,
        'geopolitical_tension': geopolitical_tension,
        'is_business_hours': is_business_hours,
        'impact_score': impact_score
    })
    
    return data

def train_elite_ensemble_model():
    print("🚀 Generating Elite Intelligence Dataset (Operation: Black Horizon)...")
    df = generate_elite_cyber_data()
    
    X = df.drop('impact_score', axis=1)
    y = df['impact_score']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("🧠 Training Neural Core Ensemble (RF + GBM)...")
    
    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    gbm = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, random_state=42)
    
    # Hybrid Ensemble
    ensemble = VotingRegressor([('rf', rf), ('gbm', gbm)])
    ensemble.fit(X_train, y_train)
    
    # Evaluation
    predictions = ensemble.predict(X_test)
    mse = mean_squared_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    print(f"✅ Training Complete. Metrics:")
    print(f"   - MSE: {mse:.4f}")
    print(f"   - R2 Score: {r2:.4f}")
    
    # Save the model
    # Note: Use joblib for scikit-learn models
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, 'risk_model.joblib')
        joblib.dump(ensemble, model_path)
        print(f"💾 Elite Model persisted to: {model_path}")
    except Exception as e:
        print(f"❌ Error saving model: {e}")

if __name__ == "__main__":
    train_elite_ensemble_model()
