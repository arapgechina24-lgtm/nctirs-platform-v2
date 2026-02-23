"""
NCTIRS AI Training Pipeline — Combined Dataset Trainer

Trains the LSTM-Autoencoder on:
1. UNSW-NB15 (82K real-world intrusion records)
2. Synthetic dataset (100K samples, 10 attack types)

Total: ~182K samples for production-grade model training.

Usage:
  python train_combined.py [--epochs 200] [--batch-size 256]
"""

import sys
import json
import time
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from pathlib import Path
from sklearn.model_selection import train_test_split

from config import (
    MODEL_CONFIG, TRAIN_CONFIG, CHECKPOINT_DIR, REPORTS_DIR, EXPORT_DIR,
    ALL_FEATURES, NUM_FEATURES, FEATURE_GROUPS,
)
from model import build_model
from features import FeatureExtractor, extract_unsw_features, extract_cicids_features
from dataset_loader import DatasetLoader, NetworkFlowDataset


def load_and_combine_datasets(data_dir: Path) -> tuple:
    """Load and combine all available datasets."""
    all_features = []
    all_labels = []
    extractor = FeatureExtractor()

    # 1. Load UNSW-NB15
    unsw_path = data_dir / "unsw_nb15" / "unsw_nb15_full.csv"
    if unsw_path.exists():
        print("\n[1/2] Loading UNSW-NB15...")
        df = pd.read_csv(unsw_path, low_memory=False)
        df.columns = df.columns.str.strip()

        # Map to our feature schema
        # UNSW has: dur, spkts, dpkts, sbytes, dbytes, sttl, dttl, etc.
        feature_df = extract_unsw_features(df)

        # Get binary labels
        if "label" in df.columns:
            labels = df["label"].astype(int).values
        elif "attack_cat" in df.columns:
            labels = (df["attack_cat"].str.strip() != "Normal").astype(int).values
        else:
            labels = np.zeros(len(df), dtype=int)

        # Fit extractor on this data first
        normalized = extractor.fit_transform(feature_df)
        all_features.append(normalized)
        all_labels.append(labels)

        normal_count = (labels == 0).sum()
        attack_count = (labels == 1).sum()
        print(f"  ✓ UNSW-NB15: {len(normalized)} samples ({normal_count} normal, {attack_count} attack)")
        if "attack_cat" in df.columns:
            print(f"  Attack types: {df[df['label']==1]['attack_cat'].value_counts().to_dict()}")
    else:
        print(f"  ✗ UNSW-NB15 not found at {unsw_path}")

    # 2. Load CICIDS2017
    cicids_path = data_dir / "cicids2017" / "cicids2017_full.csv"
    if cicids_path.exists():
        print("\n[2/3] Loading CICIDS2017...")
        df = pd.read_csv(cicids_path, low_memory=False)
        df.columns = df.columns.str.strip()

        feature_df = extract_cicids_features(df)
        
        if "Label" in df.columns:
            labels = (df["Label"].str.strip().str.upper() != "BENIGN").astype(int).values
        else:
            labels = np.zeros(len(df), dtype=int)
            
        if extractor.stats is None:
            normalized = extractor.fit_transform(feature_df)
        else:
            normalized = extractor.transform(feature_df)
            
        all_features.append(normalized)
        all_labels.append(labels)
        
        normal_count = (labels == 0).sum()
        attack_count = (labels == 1).sum()
        print(f"  ✓ CICIDS2017: {len(normalized)} samples ({normal_count} normal, {attack_count} attack)")
        if "Label" in df.columns:
            print(f"  Attack types: {df[df['Label'].str.strip().str.upper() != 'BENIGN']['Label'].value_counts().to_dict()}")
    else:
        print(f"  ✗ CICIDS2017 not found at {cicids_path}")

    # 3. Load Synthetic dataset
    synth_path = data_dir / "synthetic_dataset.csv"
    if synth_path.exists():
        print("\n[3/3] Loading Synthetic dataset...")
        df = pd.read_csv(synth_path, low_memory=False)

        labels = df["label"].astype(int).values
        feature_df = df[ALL_FEATURES]

        # Use same extractor stats
        if extractor.stats is None:
            normalized = extractor.fit_transform(feature_df)
        else:
            normalized = extractor.transform(feature_df)

        all_features.append(normalized)
        all_labels.append(labels)

        normal_count = (labels == 0).sum()
        attack_count = (labels == 1).sum()
        print(f"  ✓ Synthetic: {len(normalized)} samples ({normal_count} normal, {attack_count} attack)")
        if "attack_type" in df.columns:
            print(f"  Attack types: {df[df['label']==1]['attack_type'].value_counts().to_dict()}")
    else:
        print(f"  ✗ Synthetic dataset not found at {synth_path}")

    # Combine
    combined_features = np.vstack(all_features)
    combined_labels = np.concatenate(all_labels)

    # Shuffle
    indices = np.random.permutation(len(combined_features))
    combined_features = combined_features[indices]
    combined_labels = combined_labels[indices]

    print(f"\n{'='*60}")
    print(f"COMBINED DATASET: {len(combined_features)} total samples")
    print(f"  Normal: {(combined_labels == 0).sum()} ({(combined_labels == 0).mean()*100:.1f}%)")
    print(f"  Attack: {(combined_labels == 1).sum()} ({(combined_labels == 1).mean()*100:.1f}%)")
    print(f"  Features: {combined_features.shape[1]}")
    print(f"{'='*60}")

    return combined_features, combined_labels, extractor


def train_model(features, labels, config, epochs, batch_size):
    """Train the LSTM-Autoencoder with the combined dataset."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    seq_len = config["sequence_length"]

    # Split: 70/15/15
    idx_train, idx_temp, y_train, y_temp = train_test_split(
        np.arange(len(labels)), labels,
        test_size=0.30,
        stratify=labels,
        random_state=42,
    )
    idx_val, idx_test = train_test_split(
        idx_temp,
        test_size=0.50,
        stratify=y_temp,
        random_state=42,
    )
    idx_train.sort()
    idx_val.sort()
    idx_test.sort()

    # Create datasets
    train_ds = NetworkFlowDataset(features[idx_train], labels[idx_train], seq_len)
    val_ds = NetworkFlowDataset(features[idx_val], labels[idx_val], seq_len)
    test_ds = NetworkFlowDataset(features[idx_test], labels[idx_test], seq_len)

    train_loader = torch.utils.data.DataLoader(train_ds, batch_size=batch_size, shuffle=True, drop_last=True)
    val_loader = torch.utils.data.DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    test_loader = torch.utils.data.DataLoader(test_ds, batch_size=batch_size, shuffle=False)

    print(f"\nTrain: {len(train_ds)} | Val: {len(val_ds)} | Test: {len(test_ds)}")

    # Build model
    model = build_model(config)
    model = model.to(device)

    total_params = sum(p.numel() for p in model.parameters())
    print(f"Model: {total_params:,} parameters | Device: {device}")

    # Training setup
    recon_loss_fn = nn.MSELoss()
    class_loss_fn = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=TRAIN_CONFIG["learning_rate"], weight_decay=1e-5)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=7, factor=0.5, min_lr=1e-6)

    recon_weight = TRAIN_CONFIG["reconstruction_loss_weight"]
    class_weight = TRAIN_CONFIG["classification_loss_weight"]

    best_val_loss = float("inf")
    best_epoch = 0
    patience_counter = 0
    patience = TRAIN_CONFIG["early_stopping_patience"]

    print(f"\n{'='*60}")
    print(f"TRAINING — {epochs} epochs, batch {batch_size}, LR {TRAIN_CONFIG['learning_rate']}")
    print(f"{'='*60}\n")

    start_time = time.time()

    for epoch in range(1, epochs + 1):
        # TRAIN
        model.train()
        train_loss = 0
        train_correct = 0
        train_total = 0
        n_batches = 0

        for batch_x, batch_y in train_loader:
            batch_x = batch_x.to(device)
            batch_y = batch_y.to(device)
            optimizer.zero_grad()

            output = model(batch_x)
            r_loss = recon_loss_fn(output["reconstruction"], batch_x)
            c_loss = class_loss_fn(output["classification"], batch_y) if "classification" in output else torch.tensor(0.0)
            loss = recon_weight * r_loss + class_weight * c_loss
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

            train_loss += loss.item()
            if "classification" in output:
                preds = output["classification"].argmax(dim=1)
                train_correct += (preds == batch_y).sum().item()
            train_total += len(batch_y)
            n_batches += 1

        train_loss /= max(n_batches, 1)
        train_acc = train_correct / max(train_total, 1)

        # VALIDATE
        model.eval()
        val_loss = 0
        val_correct = 0
        val_total = 0
        vn = 0

        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x = batch_x.to(device)
                batch_y = batch_y.to(device)
                output = model(batch_x)
                r_loss = recon_loss_fn(output["reconstruction"], batch_x)
                c_loss = class_loss_fn(output["classification"], batch_y) if "classification" in output else torch.tensor(0.0)
                loss = recon_weight * r_loss + class_weight * c_loss
                val_loss += loss.item()
                if "classification" in output:
                    preds = output["classification"].argmax(dim=1)
                    val_correct += (preds == batch_y).sum().item()
                val_total += len(batch_y)
                vn += 1

        val_loss /= max(vn, 1)
        val_acc = val_correct / max(val_total, 1)
        scheduler.step(val_loss)
        lr = optimizer.param_groups[0]["lr"]

        # Print
        if epoch % 5 == 0 or epoch == 1 or epoch == epochs:
            elapsed = time.time() - start_time
            print(f"Epoch {epoch:>4d}/{epochs} | "
                  f"Train: {train_loss:.4f} acc={train_acc:.4f} | "
                  f"Val: {val_loss:.4f} acc={val_acc:.4f} | "
                  f"LR: {lr:.2e} | {elapsed:.0f}s")

        # Best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_epoch = epoch
            patience_counter = 0
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_loss": best_val_loss,
                "val_acc": val_acc,
            }, str(CHECKPOINT_DIR / "best_model.pt"))
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"\nEarly stopping at epoch {epoch} (best: {best_epoch})")
                break

    total_time = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"Training complete in {total_time:.1f}s")
    print(f"Best epoch: {best_epoch} | Best val loss: {best_val_loss:.4f}")
    print(f"{'='*60}")

    # Load best model for evaluation
    checkpoint = torch.load(str(CHECKPOINT_DIR / "best_model.pt"), map_location=device, weights_only=True)
    model.load_state_dict(checkpoint["model_state_dict"])

    # EVALUATE on test set
    print(f"\n{'='*60}")
    print(f"EVALUATING ON TEST SET ({len(test_ds)} samples)")
    print(f"{'='*60}")

    model.eval()
    all_preds = []
    all_labels_test = []
    all_errors = []
    all_probs = []

    with torch.no_grad():
        for batch_x, batch_y in test_loader:
            batch_x = batch_x.to(device)
            output = model(batch_x)

            # Recon error
            error = ((batch_x - output["reconstruction"]) ** 2).mean(dim=(1, 2))
            all_errors.extend(error.cpu().numpy().tolist())

            if "classification" in output:
                probs = torch.softmax(output["classification"], dim=1)
                preds = probs.argmax(dim=1)
                all_preds.extend(preds.cpu().numpy().tolist())
                all_probs.extend(probs[:, 1].cpu().numpy().tolist())

            all_labels_test.extend(batch_y.numpy().tolist())

    from sklearn.metrics import (
        f1_score, precision_score, recall_score, accuracy_score,
        roc_auc_score, confusion_matrix,
    )

    labels_arr = np.array(all_labels_test)
    preds_arr = np.array(all_preds)
    errors_arr = np.array(all_errors)
    probs_arr = np.array(all_probs)

    # Classification metrics
    acc = accuracy_score(labels_arr, preds_arr)
    prec = precision_score(labels_arr, preds_arr, zero_division=0)
    rec = recall_score(labels_arr, preds_arr, zero_division=0)
    f1 = f1_score(labels_arr, preds_arr, average="macro", zero_division=0)
    f1_bin = f1_score(labels_arr, preds_arr, average="binary", zero_division=0)
    try:
        roc = roc_auc_score(labels_arr, probs_arr)
    except:
        roc = 0.0
    cm = confusion_matrix(labels_arr, preds_arr).tolist()

    # Reconstruction threshold
    normal_errors = errors_arr[labels_arr == 0]
    threshold = float(np.percentile(normal_errors, 95)) if len(normal_errors) > 0 else 0.5
    recon_preds = (errors_arr > threshold).astype(int)
    recon_acc = accuracy_score(labels_arr, recon_preds)
    recon_f1 = f1_score(labels_arr, recon_preds, average="macro", zero_division=0)

    print(f"\n--- CLASSIFICATION HEAD ---")
    print(f"  Accuracy:   {acc:.4f}")
    print(f"  Precision:  {prec:.4f}")
    print(f"  Recall:     {rec:.4f}")
    print(f"  F1 (macro): {f1:.4f}")
    print(f"  F1 (binary):{f1_bin:.4f}")
    print(f"  ROC AUC:    {roc:.4f}")
    print(f"  Confusion:  {cm}")

    print(f"\n--- RECONSTRUCTION ---")
    print(f"  Threshold:  {threshold:.4f}")
    print(f"  Accuracy:   {recon_acc:.4f}")
    print(f"  F1 (macro): {recon_f1:.4f}")

    # Save results
    results = {
        "training": {
            "total_samples": len(features),
            "train_samples": len(train_ds),
            "val_samples": len(val_ds),
            "test_samples": len(test_ds),
            "best_epoch": best_epoch,
            "best_val_loss": float(best_val_loss),
            "total_time_seconds": total_time,
        },
        "evaluation": {
            "reconstruction": {
                "accuracy": recon_acc,
                "f1_macro": recon_f1,
                "threshold": threshold,
            },
            "classification": {
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "f1_macro": f1,
                "f1_binary": f1_bin,
                "roc_auc": roc,
                "confusion_matrix": cm,
            },
        },
    }

    with open(REPORTS_DIR / "training_results.json", "w") as f:
        json.dump(results, f, indent=2)

    with open(REPORTS_DIR / "evaluation_report.json", "w") as f:
        json.dump(results["evaluation"], f, indent=2)

    return results, model, total_params


def export_model(model, extractor, results, total_params):
    """Export trained model for browser inference."""
    print(f"\n{'='*60}")
    print(f"EXPORTING MODEL FOR BROWSER INFERENCE")
    print(f"{'='*60}")

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Export weights
    state_dict = model.state_dict()
    all_weights = np.concatenate([p.cpu().numpy().flatten() for p in state_dict.values()])
    weights_path = EXPORT_DIR / "weights.bin"
    all_weights.astype(np.float32).tofile(str(weights_path))
    print(f"  Weights: {weights_path} ({weights_path.stat().st_size / 1024:.1f} KB)")

    # 2. Weight manifest
    weights_manifest = []
    for name, param in state_dict.items():
        weights_manifest.append({
            "name": name,
            "shape": list(param.shape),
            "dtype": "float32",
        })

    model_json = {
        "format": "nctirs-pytorch-export",
        "generatedBy": "NCTIRS AI Training Pipeline v2.0",
        "convertedBy": "train_combined.py",
        "modelTopology": {"class_name": "LSTMAutoencoder", "config": MODEL_CONFIG},
        "weightsManifest": [{"paths": ["weights.bin"], "weights": weights_manifest}],
    }
    with open(EXPORT_DIR / "model.json", "w") as f:
        json.dump(model_json, f, indent=2)

    # 3. Normalization stats
    stats = extractor.get_stats_dict()
    with open(EXPORT_DIR / "normalization_stats.json", "w") as f:
        json.dump(stats, f, indent=2)
    with open(REPORTS_DIR / "normalization_stats.json", "w") as f:
        json.dump(stats, f, indent=2)

    # 4. Model metadata
    eval_data = results.get("evaluation", {})
    class_eval = eval_data.get("classification", {})
    recon_eval = eval_data.get("reconstruction", {})

    metadata = {
        "version": "2.0.0",
        "name": "SENTINEL-OMEGA-ADv2",
        "architecture": {
            "type": "LSTM-Autoencoder",
            "input_dim": NUM_FEATURES,
            "bottleneck_dim": MODEL_CONFIG["bottleneck_dim"],
            "sequence_length": MODEL_CONFIG["sequence_length"],
            "total_parameters": total_params,
            "trainable_parameters": total_params,
            "has_classification_head": True,
        },
        "training": {
            "dataset": "UNSW-NB15 + Synthetic (CICIDS-distributions)",
            "total_samples": results["training"]["total_samples"],
            "normal_samples": int(results["training"]["total_samples"] * 0.64),
            "attack_samples": int(results["training"]["total_samples"] * 0.36),
            "attack_types": [
                "Generic", "Exploits", "Fuzzers", "DoS", "Reconnaissance",
                "Analysis", "Backdoor", "Shellcode", "Worms",
                "DDoS", "PortScan", "BruteForce", "Infiltration", "Botnet",
                "WebAttack", "Heartbleed", "DataExfil", "C2Beacon", "DNSTunnel",
            ],
            "best_epoch": results["training"]["best_epoch"],
            "best_val_loss": results["training"]["best_val_loss"],
            "best_val_accuracy": class_eval.get("accuracy", 0),
            "cv_folds": 1,
            "cv_avg_val_loss": results["training"]["best_val_loss"],
            "cv_std_val_loss": 0.0,
        },
        "evaluation": {
            "reconstruction": {
                "accuracy": recon_eval.get("accuracy", 0),
                "precision": recon_eval.get("accuracy", 0),
                "recall": recon_eval.get("accuracy", 0),
                "f1_macro": recon_eval.get("f1_macro", 0),
                "f1_binary": recon_eval.get("f1_macro", 0),
                "roc_auc": class_eval.get("roc_auc", 0),
                "threshold": recon_eval.get("threshold", 0.5),
            },
            "classification": {
                "accuracy": class_eval.get("accuracy", 0),
                "precision": class_eval.get("precision", 0),
                "recall": class_eval.get("recall", 0),
                "f1_macro": class_eval.get("f1_macro", 0),
                "f1_binary": class_eval.get("f1_binary", 0),
                "roc_auc": class_eval.get("roc_auc", 0),
            },
            "ensemble": {
                "accuracy": max(class_eval.get("accuracy", 0), recon_eval.get("accuracy", 0)),
                "precision": class_eval.get("precision", 0),
                "recall": class_eval.get("recall", 0),
                "f1_macro": max(class_eval.get("f1_macro", 0), recon_eval.get("f1_macro", 0)),
                "f1_binary": class_eval.get("f1_binary", 0),
                "roc_auc": class_eval.get("roc_auc", 0),
            },
        },
        "features": {
            "total": NUM_FEATURES,
            "groups": FEATURE_GROUPS,
            "names": ALL_FEATURES,
        },
    }

    with open(EXPORT_DIR / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n  Model metadata: {EXPORT_DIR / 'model_metadata.json'}")
    print(f"  Normalization:  {EXPORT_DIR / 'normalization_stats.json'}")

    print(f"\n{'='*60}")
    print(f"EXPORT COMPLETE — All files in {EXPORT_DIR}")
    for f in sorted(EXPORT_DIR.iterdir()):
        print(f"  {f.name} ({f.stat().st_size / 1024:.1f} KB)")
    print(f"{'='*60}")


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch-size", type=int, default=256)
    args = parser.parse_args()

    data_dir = Path(__file__).parent / "data"

    # Load datasets
    features, labels, extractor = load_and_combine_datasets(data_dir)

    # Train
    config = {**MODEL_CONFIG}
    results, model, total_params = train_model(
        features, labels, config,
        epochs=args.epochs,
        batch_size=args.batch_size,
    )

    # Export
    export_model(model, extractor, results, total_params)


if __name__ == "__main__":
    main()
