"""
NCTIRS AI Training Pipeline — Evaluation Suite

Computes production-grade metrics:
  - F1 Score (macro, micro, weighted)
  - Precision, Recall, Accuracy
  - ROC AUC
  - Confusion Matrix
  - Per-class metrics

Usage:
  python evaluate.py --checkpoint checkpoints/best_model.pt
  python evaluate.py --checkpoint checkpoints/best_model_fold1.pt --dataset synthetic
"""

import argparse
import json
import glob
import numpy as np
import torch
from sklearn.metrics import (
    f1_score, precision_score, recall_score, accuracy_score,
    roc_auc_score, confusion_matrix, classification_report,
)
from typing import Dict

from config import MODEL_CONFIG, TRAIN_CONFIG, CHECKPOINT_DIR, REPORTS_DIR, EXPORT_DIR
from model import build_model
from dataset_loader import DatasetLoader


def evaluate_model(
    model: torch.nn.Module,
    dataloader,
    device: torch.device,
    threshold_percentile: int = 95,
) -> Dict:
    """
    Comprehensive evaluation of the anomaly detection model.

    Uses two methods:
      1. Reconstruction error with auto-threshold
      2. Classification head (if available)

    Returns:
        dict with all metrics
    """
    model.eval()

    all_labels = []
    all_recon_errors = []
    all_class_preds = []
    all_class_probs = []

    with torch.no_grad():
        for batch_x, batch_y in dataloader:
            batch_x = batch_x.to(device)
            output = model(batch_x)

            # Reconstruction error
            per_sample_error = ((batch_x - output["reconstruction"]) ** 2).mean(dim=(1, 2))
            all_recon_errors.extend(per_sample_error.cpu().numpy().tolist())

            # Classification
            if "classification" in output:
                probs = torch.softmax(output["classification"], dim=1)
                preds = probs.argmax(dim=1)
                all_class_preds.extend(preds.cpu().numpy().tolist())
                all_class_probs.extend(probs[:, 1].cpu().numpy().tolist())  # P(anomaly)

            all_labels.extend(batch_y.numpy().tolist())

    labels = np.array(all_labels)
    recon_errors = np.array(all_recon_errors)

    # Determine reconstruction-based threshold from normal samples
    normal_errors = recon_errors[labels == 0]
    if len(normal_errors) > 0:
        threshold = np.percentile(normal_errors, threshold_percentile)
    else:
        threshold = np.percentile(recon_errors, threshold_percentile)

    # Reconstruction-based predictions
    recon_preds = (recon_errors > threshold).astype(int)

    results = {
        "threshold": float(threshold),
        "threshold_percentile": threshold_percentile,
        "total_samples": len(labels),
        "normal_samples": int((labels == 0).sum()),
        "attack_samples": int((labels == 1).sum()),
    }

    # Reconstruction-based metrics
    results["reconstruction"] = _compute_metrics(labels, recon_preds, recon_errors)
    results["reconstruction"]["threshold"] = float(threshold)

    # Classification-based metrics
    if all_class_preds:
        class_preds = np.array(all_class_preds)
        class_probs = np.array(all_class_probs)
        results["classification"] = _compute_metrics(labels, class_preds, class_probs)

    # Combined (ensemble) prediction
    if all_class_preds:
        # Normalize reconstruction errors to 0-1 range
        recon_norm = (recon_errors - recon_errors.min()) / (recon_errors.max() - recon_errors.min() + 1e-8)
        combined_score = 0.5 * recon_norm + 0.5 * np.array(all_class_probs)
        combined_preds = (combined_score > 0.5).astype(int)
        results["ensemble"] = _compute_metrics(labels, combined_preds, combined_score)

    return results


def _compute_metrics(labels: np.ndarray, predictions: np.ndarray, scores: np.ndarray) -> Dict:
    """Compute all classification metrics."""
    metrics = {}

    # Basic metrics
    metrics["accuracy"] = float(accuracy_score(labels, predictions))
    metrics["precision"] = float(precision_score(labels, predictions, zero_division=0))
    metrics["recall"] = float(recall_score(labels, predictions, zero_division=0))

    # F1 Scores
    metrics["f1_macro"] = float(f1_score(labels, predictions, average="macro", zero_division=0))
    metrics["f1_micro"] = float(f1_score(labels, predictions, average="micro", zero_division=0))
    metrics["f1_weighted"] = float(f1_score(labels, predictions, average="weighted", zero_division=0))
    metrics["f1_binary"] = float(f1_score(labels, predictions, average="binary", zero_division=0))

    # ROC AUC
    try:
        metrics["roc_auc"] = float(roc_auc_score(labels, scores))
    except ValueError:
        metrics["roc_auc"] = 0.0

    # Confusion Matrix
    cm = confusion_matrix(labels, predictions).tolist()
    metrics["confusion_matrix"] = cm

    if len(cm) == 2:
        tn, fp, fn, tp = cm[0][0], cm[0][1], cm[1][0], cm[1][1]
        metrics["true_positives"] = tp
        metrics["true_negatives"] = tn
        metrics["false_positives"] = fp
        metrics["false_negatives"] = fn
        metrics["false_positive_rate"] = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        metrics["false_negative_rate"] = fn / (fn + tp) if (fn + tp) > 0 else 0.0

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Evaluate trained anomaly detection model")
    parser.add_argument("--checkpoint", type=str, default=None,
                        help="Path to model checkpoint (default: best_model.pt)")
    parser.add_argument("--dataset", type=str, default="synthetic",
                        choices=["synthetic", "cicids", "unsw"])
    parser.add_argument("--data-path", type=str, default=None)
    parser.add_argument("--batch-size", type=int, default=TRAIN_CONFIG["batch_size"])
    parser.add_argument("--threshold-percentile", type=int, default=95)
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load model
    model = build_model(MODEL_CONFIG)

    checkpoint_path = args.checkpoint or str(CHECKPOINT_DIR / "best_model.pt")
    if not torch.cuda.is_available():
        checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    else:
        checkpoint = torch.load(checkpoint_path, weights_only=True)

    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    print(f"Loaded checkpoint from epoch {checkpoint['epoch']} (val_loss: {checkpoint['val_loss']:.4f})")

    # Load dataset
    loader = DatasetLoader(seq_len=MODEL_CONFIG["sequence_length"])
    if args.dataset == "synthetic":
        features, labels = loader.load_synthetic()
    elif args.dataset == "cicids":
        csv_files = glob.glob(args.data_path) if args.data_path and "*" in args.data_path else [args.data_path] if args.data_path else []
        features, labels = loader.load_cicids(csv_files)
    elif args.dataset == "unsw":
        csv_files = glob.glob(args.data_path) if args.data_path and "*" in args.data_path else [args.data_path] if args.data_path else []
        features, labels = loader.load_unsw(csv_files)

    dataloaders = loader.create_dataloaders(features, labels, batch_size=args.batch_size)

    # Evaluate on test set
    print("\nEvaluating on test set...")
    results = evaluate_model(model, dataloaders["test"], device, args.threshold_percentile)

    # Print results
    print(f"\n{'='*60}")
    print(f"EVALUATION RESULTS")
    print(f"{'='*60}")

    for method in ["reconstruction", "classification", "ensemble"]:
        if method in results:
            m = results[method]
            print(f"\n--- {method.upper()} ---")
            print(f"  Accuracy:     {m['accuracy']:.4f}")
            print(f"  Precision:    {m['precision']:.4f}")
            print(f"  Recall:       {m['recall']:.4f}")
            print(f"  F1 (macro):   {m['f1_macro']:.4f}")
            print(f"  F1 (binary):  {m['f1_binary']:.4f}")
            print(f"  ROC AUC:      {m['roc_auc']:.4f}")
            if "confusion_matrix" in m:
                print(f"  Confusion Matrix: {m['confusion_matrix']}")

    # Save evaluation report
    report_path = REPORTS_DIR / "evaluation_report.json"
    with open(report_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nReport saved to {report_path}")

    # Also save to export dir for the TypeScript engine
    export_report_path = EXPORT_DIR / "evaluation_report.json"
    with open(export_report_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Report copied to {export_report_path}")


if __name__ == "__main__":
    main()
