"""
NCTIRS AI Training Pipeline — Weight Export

Converts PyTorch model weights to TensorFlow.js format for browser inference.

Pipeline:
  PyTorch (.pt) → TensorFlow SavedModel → TensorFlow.js (model.json + weight shards)

Also exports:
  - normalization_stats.json (for feature preprocessing in browser)
  - model_metadata.json (version, architecture, training metrics)

Usage:
  python export_weights.py --checkpoint checkpoints/best_model.pt
"""

import argparse
import json
import shutil
import numpy as np
import torch
from pathlib import Path
from typing import Dict

from config import (
    MODEL_CONFIG, EXPORT_CONFIG, EXPORT_DIR, CHECKPOINT_DIR, REPORTS_DIR,
    ALL_FEATURES, NUM_FEATURES, FEATURE_GROUPS,
)
from model import build_model


def export_to_tfjs_format(
    model: torch.nn.Module,
    export_dir: Path,
    model_name: str = "anomaly-detector",
) -> str:
    """
    Export PyTorch model weights in a TensorFlow.js-compatible JSON format.

    Since we're running in an environment that may not have TF installed,
    this function directly serializes the weights into a format that
    TensorFlow.js can load using the tf.loadLayersModel() API with
    custom weight loading.

    Returns:
        Path to the exported model.json
    """
    export_dir.mkdir(parents=True, exist_ok=True)

    model.eval()
    state_dict = model.state_dict()

    # Convert weights to serializable format
    weights_manifest = []
    weight_data = {}

    for name, param in state_dict.items():
        tensor = param.cpu().numpy()
        weight_entry = {
            "name": name,
            "shape": list(tensor.shape),
            "dtype": "float32",
        }
        weights_manifest.append(weight_entry)
        weight_data[name] = tensor.astype(np.float32)

    # Save weights as binary
    weights_path = export_dir / "weights.bin"
    all_weights = np.concatenate([w.flatten() for w in weight_data.values()])
    all_weights.tofile(str(weights_path))

    # Build model.json (TF.js-compatible manifest)
    model_json = {
        "format": "nctirs-pytorch-export",
        "generatedBy": "NCTIRS AI Training Pipeline",
        "convertedBy": "export_weights.py",
        "modelTopology": {
            "class_name": "LSTMAutoencoder",
            "config": MODEL_CONFIG,
        },
        "weightsManifest": [{
            "paths": ["weights.bin"],
            "weights": weights_manifest,
        }],
    }

    model_json_path = export_dir / "model.json"
    with open(model_json_path, "w") as f:
        json.dump(model_json, f, indent=2)

    print(f"Model exported to {model_json_path}")
    print(f"Weights saved to {weights_path} ({weights_path.stat().st_size / 1024:.1f} KB)")

    return str(model_json_path)


def export_normalization_stats(export_dir: Path) -> str:
    """
    Export feature normalization stats for the TypeScript inference engine.

    Reads from the training pipeline's saved stats and formats for browser use.
    """
    # Try loading from training reports
    stats_path = REPORTS_DIR / "normalization_stats.json"
    if stats_path.exists():
        with open(stats_path) as f:
            stats = json.load(f)
    else:
        # Generate default stats (will be overwritten when training is run)
        print("Warning: No training stats found. Using default normalization values.")
        stats = {
            "features": ALL_FEATURES,
            "num_features": NUM_FEATURES,
            "feature_groups": FEATURE_GROUPS,
            "normalization": {
                feat: {"mean": 0.0, "std": 1.0, "min": -5.0, "max": 5.0}
                for feat in ALL_FEATURES
            },
        }

    output_path = export_dir / "normalization_stats.json"
    with open(output_path, "w") as f:
        json.dump(stats, f, indent=2)

    print(f"Normalization stats exported to {output_path}")
    return str(output_path)


def export_model_metadata(
    model: torch.nn.Module,
    checkpoint: Dict,
    export_dir: Path,
) -> str:
    """Export model metadata including architecture, version, and training info."""

    arch_info = model.get_architecture_info()

    metadata = {
        "version": EXPORT_CONFIG["model_version"],
        "name": EXPORT_CONFIG["model_name"],
        "architecture": {
            "type": arch_info["model_type"],
            "input_dim": arch_info["input_dim"],
            "bottleneck_dim": arch_info["bottleneck_dim"],
            "sequence_length": arch_info["sequence_length"],
            "total_parameters": arch_info["total_parameters"],
            "trainable_parameters": arch_info["trainable_parameters"],
            "has_classification_head": arch_info["has_classification_head"],
        },
        "training": {
            "best_epoch": checkpoint.get("epoch", 0),
            "best_val_loss": checkpoint.get("val_loss", 0),
            "best_val_accuracy": checkpoint.get("val_acc", 0),
        },
        "features": {
            "total": NUM_FEATURES,
            "names": ALL_FEATURES,
            "groups": FEATURE_GROUPS,
        },
        "config": MODEL_CONFIG,
    }

    # Include evaluation report if available
    eval_path = REPORTS_DIR / "evaluation_report.json"
    if eval_path.exists():
        with open(eval_path) as f:
            metadata["evaluation"] = json.load(f)

    output_path = export_dir / "model_metadata.json"
    with open(output_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Model metadata exported to {output_path}")
    return str(output_path)


def main():
    parser = argparse.ArgumentParser(description="Export trained model for TensorFlow.js")
    parser.add_argument("--checkpoint", type=str, default=None,
                        help="Path to model checkpoint")
    parser.add_argument("--output-dir", type=str, default=None,
                        help="Export directory (default: public/models/anomaly-detector-v2/)")
    args = parser.parse_args()

    export_dir = Path(args.output_dir) if args.output_dir else EXPORT_DIR
    export_dir.mkdir(parents=True, exist_ok=True)

    # Load model
    model = build_model(MODEL_CONFIG)

    checkpoint_path = args.checkpoint or str(CHECKPOINT_DIR / "best_model.pt")
    checkpoint_file = Path(checkpoint_path)

    if checkpoint_file.exists():
        if torch.cuda.is_available():
            checkpoint = torch.load(checkpoint_path, weights_only=True)
        else:
            checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
        model.load_state_dict(checkpoint["model_state_dict"])
        print(f"Loaded checkpoint: epoch {checkpoint['epoch']}, val_loss {checkpoint['val_loss']:.4f}")
    else:
        print(f"Warning: No checkpoint found at {checkpoint_path}")
        print("Exporting model with random weights (for architecture testing)")
        checkpoint = {"epoch": 0, "val_loss": 0, "val_acc": 0}

    # Export
    print(f"\n{'='*60}")
    print(f"Exporting Model: {EXPORT_CONFIG['model_name']} v{EXPORT_CONFIG['model_version']}")
    print(f"Output: {export_dir}")
    print(f"{'='*60}\n")

    export_to_tfjs_format(model, export_dir)
    export_normalization_stats(export_dir)
    export_model_metadata(model, checkpoint, export_dir)

    # Copy evaluation report if exists
    eval_src = REPORTS_DIR / "evaluation_report.json"
    if eval_src.exists():
        shutil.copy(eval_src, export_dir / "evaluation_report.json")
        print(f"Evaluation report copied to {export_dir / 'evaluation_report.json'}")

    print(f"\n{'='*60}")
    print(f"Export complete! Files in {export_dir}:")
    for f in sorted(export_dir.iterdir()):
        size = f.stat().st_size
        print(f"  {f.name} ({size / 1024:.1f} KB)")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
