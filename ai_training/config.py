"""
NCTIRS AI Training Pipeline — Central Configuration

All hyperparameters, feature definitions, paths, and constants.
"""

import os
from pathlib import Path

# ===== Paths =====

PROJECT_ROOT = Path(__file__).parent.parent
AI_TRAINING_DIR = Path(__file__).parent
DATA_DIR = AI_TRAINING_DIR / "data"
CHECKPOINT_DIR = AI_TRAINING_DIR / "checkpoints"
EXPORT_DIR = PROJECT_ROOT / "public" / "models" / "anomaly-detector-v2"
REPORTS_DIR = AI_TRAINING_DIR / "reports"

# Create directories
for d in [DATA_DIR, CHECKPOINT_DIR, EXPORT_DIR, REPORTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ===== 46-Feature Definitions =====
# Grouped by category for clarity

FLOW_FEATURES = [
    "flow_duration",           # Total flow duration (microseconds)
    "total_fwd_packets",       # Total forward packets
    "total_bwd_packets",       # Total backward packets
    "total_fwd_bytes",         # Total bytes in forward direction
    "total_bwd_bytes",         # Total bytes in backward direction
    "flow_bytes_per_sec",      # Flow bytes per second
    "flow_packets_per_sec",    # Flow packets per second
    "flow_iat_mean",           # Mean inter-arrival time
    "flow_iat_std",            # Std of inter-arrival time
    "flow_iat_max",            # Max inter-arrival time
]

PROTOCOL_FEATURES = [
    "protocol_type",           # Protocol (TCP=0, UDP=1, ICMP=2, Other=3)
    "dst_port_entropy",        # Entropy of destination ports
    "src_port_entropy",        # Entropy of source ports
    "tcp_flag_syn_ratio",      # SYN flag ratio
    "tcp_flag_ack_ratio",      # ACK flag ratio
    "tcp_flag_fin_ratio",      # FIN flag ratio
    "tcp_flag_rst_ratio",      # RST flag ratio
    "tcp_flag_psh_ratio",      # PSH flag ratio
]

PAYLOAD_FEATURES = [
    "fwd_payload_mean",        # Mean forward payload size
    "fwd_payload_std",         # Std of forward payload size
    "bwd_payload_mean",        # Mean backward payload size
    "bwd_payload_std",         # Std of backward payload size
    "payload_entropy",         # Shannon entropy of payload bytes
    "small_packet_ratio",      # Ratio of packets < 100 bytes
    "large_packet_ratio",      # Ratio of packets > 1400 bytes
    "payload_length_variance", # Variance of payload lengths
]

CONNECTION_FEATURES = [
    "unique_src_ips",          # Unique source IPs (windowed)
    "unique_dst_ips",          # Unique destination IPs (windowed)
    "src_fanout",              # Source fan-out ratio
    "dst_fanin",               # Destination fan-in ratio
    "connection_count",        # Number of connections (windowed)
    "same_srv_rate",           # Rate of connections to same service
    "diff_srv_rate",           # Rate of connections to different services
    "connection_duration_var", # Variance of connection durations
]

TEMPORAL_FEATURES = [
    "time_of_day",             # Hour of day normalized (0-1)
    "day_of_week",             # Day of week normalized (0-1)
    "is_weekend",              # Weekend flag (0 or 1)
    "burstiness_index",        # Traffic burstiness score
    "idle_time_ratio",         # Ratio of idle time to active time
    "periodic_score",          # Periodicity detection score
]

BEHAVIORAL_FEATURES = [
    "failed_connection_ratio", # Ratio of failed/refused connections
    "dns_query_rate",          # DNS queries per second
    "dns_response_ratio",      # DNS response to query ratio
    "retransmission_rate",     # TCP retransmission rate
    "avg_ttl",                 # Average IP TTL value
    "ttl_variance",            # Variance of TTL values
]

ALL_FEATURES = (
    FLOW_FEATURES +
    PROTOCOL_FEATURES +
    PAYLOAD_FEATURES +
    CONNECTION_FEATURES +
    TEMPORAL_FEATURES +
    BEHAVIORAL_FEATURES
)

NUM_FEATURES = len(ALL_FEATURES)  # Should be 46
assert NUM_FEATURES == 46, f"Expected 46 features, got {NUM_FEATURES}"

# Feature group indices for contribution analysis
FEATURE_GROUPS = {
    "flow": list(range(0, 10)),
    "protocol": list(range(10, 18)),
    "payload": list(range(18, 26)),
    "connection": list(range(26, 34)),
    "temporal": list(range(34, 40)),
    "behavioral": list(range(40, 46)),
}

# ===== Model Architecture =====

MODEL_CONFIG = {
    "input_dim": NUM_FEATURES,         # 46
    "encoder_dims": [128, 64],         # Dense encoder layers
    "lstm_hidden": 32,                 # LSTM hidden units
    "lstm_layers": 2,                  # LSTM depth
    "bottleneck_dim": 16,              # Latent space dimension
    "decoder_dims": [64, 128],         # Dense decoder layers (mirror)
    "dropout": 0.3,                    # Dropout rate
    "sequence_length": 10,             # Temporal window for LSTM
    "classification_head": True,       # Include binary classification head
}

# ===== Training Hyperparameters =====

TRAIN_CONFIG = {
    "epochs": 200,
    "batch_size": 256,
    "learning_rate": 1e-3,
    "weight_decay": 1e-5,
    "early_stopping_patience": 15,
    "lr_scheduler_patience": 7,
    "lr_scheduler_factor": 0.5,
    "min_lr": 1e-6,
    "cv_folds": 5,
    "train_ratio": 0.70,
    "val_ratio": 0.15,
    "test_ratio": 0.15,
    "reconstruction_loss_weight": 0.7,  # For combined loss
    "classification_loss_weight": 0.3,
    "anomaly_threshold_percentile": 95, # Reconstruction error percentile
}

# ===== Dataset Configuration =====

DATASET_CONFIG = {
    "synthetic_samples": 100_000,
    "attack_ratio": 0.20,              # 20% attack traffic
    "attack_types": [
        "DDoS", "PortScan", "BruteForce", "Infiltration",
        "Botnet", "WebAttack", "Heartbleed", "DataExfil",
        "C2Beacon", "DNSTunnel",
    ],
}

# ===== Export Configuration =====

EXPORT_CONFIG = {
    "model_version": "2.0.0",
    "model_name": "SENTINEL-OMEGA-ADv2",
    "tfjs_quantize": True,             # Quantize weights for smaller size
}

# ===== Attack Type Mapping (for labeled datasets) =====

CICIDS_LABEL_MAP = {
    "BENIGN": 0,
    "DDoS": 1, "DoS Hulk": 1, "DoS GoldenEye": 1, "DoS slowloris": 1, "DoS Slowhttptest": 1,
    "PortScan": 2,
    "FTP-Patator": 3, "SSH-Patator": 3,
    "Infiltration": 4,
    "Bot": 5,
    "Web Attack – Brute Force": 6, "Web Attack – XSS": 6, "Web Attack – Sql Injection": 6,
    "Heartbleed": 7,
}

UNSW_LABEL_MAP = {
    "Normal": 0,
    "DoS": 1,
    "Reconnaissance": 2,
    "Exploits": 3,
    "Fuzzers": 4,
    "Generic": 5,
    "Analysis": 6,
    "Backdoor": 7,
    "Shellcode": 8,
    "Worms": 9,
}
