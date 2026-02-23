"""
NCTIRS AI Training Pipeline — Training Loop

Implements:
  - Full training with early stopping and LR scheduling
  - 5-fold stratified cross-validation
  - Combined reconstruction + classification loss
  - Checkpoint saving (best model per fold)
  - Comprehensive metric logging

Usage:
  python train.py --dataset synthetic --epochs 200
  python train.py --dataset cicids --data-path ./data/cicids/*.csv
  python train.py --dataset unsw --data-path ./data/unsw/*.csv
"""

import argparse
import json
import time
import glob
import numpy as np
import torch
import torch.nn as nn
from torch.optim.lr_scheduler import ReduceLROnPlateau
from pathlib import Path
from typing import Dict, List, Optional

from config import MODEL_CONFIG, TRAIN_CONFIG, CHECKPOINT_DIR, REPORTS_DIR
from model import build_model, LSTMAutoencoder
from dataset_loader import DatasetLoader


class EarlyStopping:
    """Early stopping with patience and best model checkpoint."""

    def __init__(self, patience: int = 15, min_delta: float = 1e-4):
        self.patience = patience
        self.min_delta = min_delta
        self.counter = 0
        self.best_loss = None
        self.should_stop = False

    def __call__(self, val_loss: float) -> bool:
        if self.best_loss is None:
            self.best_loss = val_loss
            return False

        if val_loss < self.best_loss - self.min_delta:
            self.best_loss = val_loss
            self.counter = 0
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.should_stop = True

        return self.should_stop


class Trainer:
    """Production training loop for the LSTM-Autoencoder."""

    def __init__(
        self,
        model: LSTMAutoencoder,
        device: torch.device,
        config: dict = None,
    ):
        self.model = model.to(device)
        self.device = device
        self.config = config or TRAIN_CONFIG

        # Loss functions
        self.reconstruction_loss = nn.MSELoss()
        self.classification_loss = nn.CrossEntropyLoss()
        self.recon_weight = self.config["reconstruction_loss_weight"]
        self.class_weight = self.config["classification_loss_weight"]

        # Optimizer
        self.optimizer = torch.optim.AdamW(
            model.parameters(),
            lr=self.config["learning_rate"],
            weight_decay=self.config["weight_decay"],
        )

        # LR Scheduler
        self.scheduler = ReduceLROnPlateau(
            self.optimizer,
            mode="min",
            patience=self.config["lr_scheduler_patience"],
            factor=self.config["lr_scheduler_factor"],
            min_lr=self.config["min_lr"],
        )

        self.history: List[Dict] = []

    def train_epoch(self, dataloader) -> Dict[str, float]:
        """Train for one epoch."""
        self.model.train()
        total_loss = 0
        total_recon = 0
        total_class = 0
        total_correct = 0
        total_samples = 0
        num_batches = 0

        for batch_x, batch_y in dataloader:
            batch_x = batch_x.to(self.device)
            batch_y = batch_y.to(self.device)

            self.optimizer.zero_grad()

            output = self.model(batch_x)

            # Reconstruction loss
            recon_loss = self.reconstruction_loss(output["reconstruction"], batch_x)

            # Classification loss
            class_loss = torch.tensor(0.0, device=self.device)
            if "classification" in output:
                class_loss = self.classification_loss(output["classification"], batch_y)
                preds = output["classification"].argmax(dim=1)
                total_correct += (preds == batch_y).sum().item()

            # Combined loss
            loss = self.recon_weight * recon_loss + self.class_weight * class_loss
            loss.backward()

            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)

            self.optimizer.step()

            total_loss += loss.item()
            total_recon += recon_loss.item()
            total_class += class_loss.item()
            total_samples += len(batch_y)
            num_batches += 1

        return {
            "loss": total_loss / max(num_batches, 1),
            "recon_loss": total_recon / max(num_batches, 1),
            "class_loss": total_class / max(num_batches, 1),
            "accuracy": total_correct / max(total_samples, 1),
        }

    @torch.no_grad()
    def validate(self, dataloader) -> Dict[str, float]:
        """Validate the model."""
        self.model.eval()
        total_loss = 0
        total_recon = 0
        total_class = 0
        total_correct = 0
        total_samples = 0
        num_batches = 0
        all_preds = []
        all_labels = []
        all_errors = []

        for batch_x, batch_y in dataloader:
            batch_x = batch_x.to(self.device)
            batch_y = batch_y.to(self.device)

            output = self.model(batch_x)

            recon_loss = self.reconstruction_loss(output["reconstruction"], batch_x)

            class_loss = torch.tensor(0.0, device=self.device)
            if "classification" in output:
                class_loss = self.classification_loss(output["classification"], batch_y)
                preds = output["classification"].argmax(dim=1)
                total_correct += (preds == batch_y).sum().item()
                all_preds.extend(preds.cpu().numpy().tolist())

            loss = self.recon_weight * recon_loss + self.class_weight * class_loss

            # Per-sample reconstruction error
            per_sample_error = ((batch_x - output["reconstruction"]) ** 2).mean(dim=(1, 2))
            all_errors.extend(per_sample_error.cpu().numpy().tolist())
            all_labels.extend(batch_y.cpu().numpy().tolist())

            total_loss += loss.item()
            total_recon += recon_loss.item()
            total_class += class_loss.item()
            total_samples += len(batch_y)
            num_batches += 1

        return {
            "loss": total_loss / max(num_batches, 1),
            "recon_loss": total_recon / max(num_batches, 1),
            "class_loss": total_class / max(num_batches, 1),
            "accuracy": total_correct / max(total_samples, 1),
            "predictions": all_preds,
            "labels": all_labels,
            "reconstruction_errors": all_errors,
        }

    def train(
        self,
        train_loader,
        val_loader,
        epochs: int = None,
        checkpoint_path: str = None,
    ) -> Dict:
        """
        Full training loop with early stopping.

        Returns:
            dict with training history and best metrics
        """
        epochs = epochs or self.config["epochs"]
        early_stopping = EarlyStopping(patience=self.config["early_stopping_patience"])
        best_val_loss = float("inf")
        best_epoch = 0

        print(f"\n{'='*60}")
        print(f"Training LSTM-Autoencoder | Device: {self.device}")
        print(f"Epochs: {epochs} | Batch: {self.config['batch_size']} | LR: {self.config['learning_rate']}")
        print(f"{'='*60}\n")

        start_time = time.time()

        for epoch in range(1, epochs + 1):
            train_metrics = self.train_epoch(train_loader)
            val_metrics = self.validate(val_loader)

            # LR scheduling
            self.scheduler.step(val_metrics["loss"])
            current_lr = self.optimizer.param_groups[0]["lr"]

            # Log
            self.history.append({
                "epoch": epoch,
                "train_loss": train_metrics["loss"],
                "train_recon": train_metrics["recon_loss"],
                "train_acc": train_metrics["accuracy"],
                "val_loss": val_metrics["loss"],
                "val_recon": val_metrics["recon_loss"],
                "val_acc": val_metrics["accuracy"],
                "lr": current_lr,
            })

            # Print progress
            if epoch % 5 == 0 or epoch == 1:
                elapsed = time.time() - start_time
                print(
                    f"Epoch {epoch:>4d}/{epochs} | "
                    f"Train Loss: {train_metrics['loss']:.4f} | "
                    f"Val Loss: {val_metrics['loss']:.4f} | "
                    f"Val Acc: {val_metrics['accuracy']:.4f} | "
                    f"LR: {current_lr:.2e} | "
                    f"Time: {elapsed:.0f}s"
                )

            # Save best model
            if val_metrics["loss"] < best_val_loss:
                best_val_loss = val_metrics["loss"]
                best_epoch = epoch
                if checkpoint_path:
                    torch.save({
                        "epoch": epoch,
                        "model_state_dict": self.model.state_dict(),
                        "optimizer_state_dict": self.optimizer.state_dict(),
                        "val_loss": best_val_loss,
                        "val_acc": val_metrics["accuracy"],
                    }, checkpoint_path)

            # Early stopping
            if early_stopping(val_metrics["loss"]):
                print(f"\nEarly stopping at epoch {epoch} (best: {best_epoch})")
                break

        total_time = time.time() - start_time
        print(f"\nTraining complete in {total_time:.1f}s | Best epoch: {best_epoch} | Best val loss: {best_val_loss:.4f}")

        return {
            "history": self.history,
            "best_epoch": best_epoch,
            "best_val_loss": best_val_loss,
            "total_time_seconds": total_time,
        }


def train_with_cross_validation(
    features: np.ndarray,
    labels: np.ndarray,
    config: dict = None,
    n_folds: int = None,
    epochs: int = None,
) -> Dict:
    """
    Train with K-fold cross-validation.

    Returns:
        dict with per-fold results and aggregated metrics
    """
    config = config or TRAIN_CONFIG
    n_folds = n_folds or config["cv_folds"]
    epochs = epochs or config["epochs"]

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    loader = DatasetLoader(seq_len=MODEL_CONFIG["sequence_length"])

    print(f"\n{'='*60}")
    print(f"Starting {n_folds}-Fold Cross-Validation")
    print(f"Device: {device} | Features: {features.shape} | Labels: {labels.shape}")
    print(f"{'='*60}")

    fold_loaders = loader.create_cv_dataloaders(features, labels, n_folds=n_folds)
    fold_results = []

    for fold_idx, fold_data in enumerate(fold_loaders):
        print(f"\n{'─'*40} Fold {fold_idx + 1}/{n_folds} {'─'*40}")

        model = build_model(MODEL_CONFIG)
        trainer = Trainer(model, device, config)

        checkpoint_path = str(CHECKPOINT_DIR / f"best_model_fold{fold_idx + 1}.pt")

        result = trainer.train(
            fold_data["train"],
            fold_data["val"],
            epochs=epochs,
            checkpoint_path=checkpoint_path,
        )

        # Final validation
        val_metrics = trainer.validate(fold_data["val"])
        result["final_val_accuracy"] = val_metrics["accuracy"]
        result["fold"] = fold_idx + 1
        fold_results.append(result)

    # Aggregate
    avg_val_loss = np.mean([r["best_val_loss"] for r in fold_results])
    avg_val_acc = np.mean([r["final_val_accuracy"] for r in fold_results])
    std_val_loss = np.std([r["best_val_loss"] for r in fold_results])
    std_val_acc = np.std([r["final_val_accuracy"] for r in fold_results])

    print(f"\n{'='*60}")
    print(f"Cross-Validation Results:")
    print(f"  Avg Val Loss: {avg_val_loss:.4f} ± {std_val_loss:.4f}")
    print(f"  Avg Val Acc:  {avg_val_acc:.4f} ± {std_val_acc:.4f}")
    print(f"{'='*60}")

    return {
        "folds": fold_results,
        "avg_val_loss": avg_val_loss,
        "std_val_loss": std_val_loss,
        "avg_val_accuracy": avg_val_acc,
        "std_val_accuracy": std_val_acc,
    }


def main():
    parser = argparse.ArgumentParser(description="Train LSTM-Autoencoder for anomaly detection")
    parser.add_argument("--dataset", type=str, default="synthetic",
                        choices=["synthetic", "cicids", "unsw"],
                        help="Dataset to train on")
    parser.add_argument("--data-path", type=str, default=None,
                        help="Path or glob pattern for dataset CSV files")
    parser.add_argument("--epochs", type=int, default=TRAIN_CONFIG["epochs"],
                        help=f"Number of epochs (default: {TRAIN_CONFIG['epochs']})")
    parser.add_argument("--batch-size", type=int, default=TRAIN_CONFIG["batch_size"])
    parser.add_argument("--cv-folds", type=int, default=TRAIN_CONFIG["cv_folds"])
    parser.add_argument("--no-cv", action="store_true", help="Skip cross-validation, train single model")
    args = parser.parse_args()

    loader = DatasetLoader(seq_len=MODEL_CONFIG["sequence_length"])

    # Load dataset
    if args.dataset == "synthetic":
        features, labels = loader.load_synthetic()
    elif args.dataset == "cicids":
        if not args.data_path:
            print("Error: --data-path required for CICIDS dataset")
            return
        csv_files = glob.glob(args.data_path) if "*" in args.data_path else [args.data_path]
        features, labels = loader.load_cicids(csv_files)
    elif args.dataset == "unsw":
        if not args.data_path:
            print("Error: --data-path required for UNSW dataset")
            return
        csv_files = glob.glob(args.data_path) if "*" in args.data_path else [args.data_path]
        features, labels = loader.load_unsw(csv_files)

    # Save normalization stats
    stats = loader.get_normalization_stats()
    stats_path = REPORTS_DIR / "normalization_stats.json"
    with open(stats_path, "w") as f:
        json.dump(stats, f, indent=2)
    print(f"Normalization stats saved to {stats_path}")

    # Train
    config = {**TRAIN_CONFIG, "batch_size": args.batch_size}

    if args.no_cv:
        # Single train/val/test split
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        dataloaders = loader.create_dataloaders(features, labels, batch_size=args.batch_size)

        model = build_model(MODEL_CONFIG)
        trainer = Trainer(model, device, config)
        checkpoint_path = str(CHECKPOINT_DIR / "best_model.pt")

        result = trainer.train(
            dataloaders["train"],
            dataloaders["val"],
            epochs=args.epochs,
            checkpoint_path=checkpoint_path,
        )

        # Save results
        results_path = REPORTS_DIR / "training_results.json"
        # Filter out non-serializable items from history
        serializable = {k: v for k, v in result.items() if k != "history"}
        serializable["history_length"] = len(result["history"])
        with open(results_path, "w") as f:
            json.dump(serializable, f, indent=2)

    else:
        # Cross-validation
        cv_results = train_with_cross_validation(
            features, labels,
            config=config,
            n_folds=args.cv_folds,
            epochs=args.epochs,
        )

        # Save results
        results_path = REPORTS_DIR / "cv_results.json"
        serializable = {
            "avg_val_loss": cv_results["avg_val_loss"],
            "std_val_loss": cv_results["std_val_loss"],
            "avg_val_accuracy": cv_results["avg_val_accuracy"],
            "std_val_accuracy": cv_results["std_val_accuracy"],
            "num_folds": len(cv_results["folds"]),
            "per_fold": [
                {
                    "fold": r["fold"],
                    "best_epoch": r["best_epoch"],
                    "best_val_loss": r["best_val_loss"],
                    "final_val_accuracy": r["final_val_accuracy"],
                    "total_time_seconds": r["total_time_seconds"],
                }
                for r in cv_results["folds"]
            ],
        }
        with open(results_path, "w") as f:
            json.dump(serializable, f, indent=2)

    print(f"\nResults saved to {results_path}")


if __name__ == "__main__":
    main()
