"""
NCTIRS AI Training Pipeline — Dataset Loader

Supports loading from:
  1. CICIDS2017 CSV files
  2. UNSW-NB15 CSV files
  3. Synthetic generated data (for testing)

Provides:
  - Stratified train/val/test splitting
  - Windowed sequence generation for LSTM
  - PyTorch DataLoader creation
"""

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader, Subset
from sklearn.model_selection import StratifiedKFold, train_test_split
from typing import Tuple, List, Dict, Optional
from pathlib import Path

from config import (
    ALL_FEATURES, NUM_FEATURES, TRAIN_CONFIG, DATASET_CONFIG,
    MODEL_CONFIG, CICIDS_LABEL_MAP, UNSW_LABEL_MAP, DATA_DIR,
)
from features import FeatureExtractor, extract_cicids_features, extract_unsw_features


class NetworkFlowDataset(Dataset):
    """PyTorch Dataset for windowed network flow sequences."""

    def __init__(
        self,
        features: np.ndarray,
        labels: np.ndarray,
        seq_len: int = 10,
    ):
        """
        Args:
            features: (num_samples, num_features) normalized array
            labels: (num_samples,) binary labels (0=normal, 1=anomaly)
            seq_len: window size for LSTM sequences
        """
        self.features = torch.tensor(features, dtype=torch.float32)
        self.labels = torch.tensor(labels, dtype=torch.long)
        self.seq_len = seq_len
        self.num_samples = len(features) - seq_len + 1

    def __len__(self) -> int:
        return max(0, self.num_samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        """Returns a (seq_len, num_features) window and the label of the last timestep."""
        window = self.features[idx : idx + self.seq_len]  # (seq_len, num_features)
        label = self.labels[idx + self.seq_len - 1]        # scalar
        return window, label


class DatasetLoader:
    """Multi-format dataset loader with preprocessing pipeline."""

    def __init__(self, seq_len: int = None):
        self.seq_len = seq_len or MODEL_CONFIG["sequence_length"]
        self.extractor = FeatureExtractor()

    def load_cicids(self, csv_paths: List[str]) -> Tuple[np.ndarray, np.ndarray]:
        """
        Load CICIDS2017 dataset from CSV files.

        Args:
            csv_paths: list of paths to CICIDS CSV files
        Returns:
            features: (N, 46) numpy array
            labels: (N,) binary labels (0=benign, 1=attack)
        """
        dfs = []
        for path in csv_paths:
            df = pd.read_csv(path, encoding="utf-8", low_memory=False)
            df.columns = df.columns.str.strip()
            dfs.append(df)
        raw_df = pd.concat(dfs, ignore_index=True)

        # Extract labels
        label_col = "Label" if "Label" in raw_df.columns else raw_df.columns[-1]
        raw_labels = raw_df[label_col].str.strip().str.upper()
        binary_labels = (raw_labels != "BENIGN").astype(int).values

        # Extract features
        feature_df = extract_cicids_features(raw_df)
        normalized = self.extractor.fit_transform(feature_df)

        print(f"[CICIDS] Loaded {len(normalized)} samples "
              f"({(binary_labels == 0).sum()} benign, {(binary_labels == 1).sum()} attack)")

        return normalized, binary_labels

    def load_unsw(self, csv_paths: List[str]) -> Tuple[np.ndarray, np.ndarray]:
        """
        Load UNSW-NB15 dataset from CSV files.

        Args:
            csv_paths: list of paths to UNSW CSV files
        Returns:
            features: (N, 46) numpy array
            labels: (N,) binary labels (0=normal, 1=attack)
        """
        dfs = []
        for path in csv_paths:
            df = pd.read_csv(path, encoding="utf-8", low_memory=False)
            df.columns = df.columns.str.strip()
            dfs.append(df)
        raw_df = pd.concat(dfs, ignore_index=True)

        # Extract labels
        if "label" in raw_df.columns:
            binary_labels = raw_df["label"].astype(int).values
        elif "Label" in raw_df.columns:
            binary_labels = raw_df["Label"].astype(int).values
        elif "attack_cat" in raw_df.columns:
            binary_labels = (raw_df["attack_cat"].str.strip() != "Normal").astype(int).values
        else:
            binary_labels = np.zeros(len(raw_df), dtype=int)

        # Extract features
        feature_df = extract_unsw_features(raw_df)
        normalized = self.extractor.fit_transform(feature_df)

        print(f"[UNSW] Loaded {len(normalized)} samples "
              f"({(binary_labels == 0).sum()} normal, {(binary_labels == 1).sum()} attack)")

        return normalized, binary_labels

    def load_synthetic(self, csv_path: str = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Load pre-generated synthetic dataset.

        Args:
            csv_path: path to synthetic CSV (default: data/synthetic_dataset.csv)
        Returns:
            features: (N, 46) numpy array
            labels: (N,) binary labels
        """
        path = csv_path or str(DATA_DIR / "synthetic_dataset.csv")
        df = pd.read_csv(path)

        # Labels in 'label' column
        labels = df["label"].astype(int).values
        feature_df = df[ALL_FEATURES]

        normalized = self.extractor.fit_transform(feature_df)

        print(f"[Synthetic] Loaded {len(normalized)} samples "
              f"({(labels == 0).sum()} normal, {(labels == 1).sum()} attack)")

        return normalized, labels

    def create_dataloaders(
        self,
        features: np.ndarray,
        labels: np.ndarray,
        batch_size: int = None,
    ) -> Dict[str, DataLoader]:
        """
        Create train/val/test DataLoaders with stratified splitting.

        Returns:
            dict with 'train', 'val', 'test' DataLoader instances
        """
        batch_size = batch_size or TRAIN_CONFIG["batch_size"]

        # Stratified split: 70/15/15
        train_ratio = TRAIN_CONFIG["train_ratio"]
        val_ratio = TRAIN_CONFIG["val_ratio"]

        # First split: train vs (val+test)
        idx_train, idx_temp, y_train, y_temp = train_test_split(
            np.arange(len(labels)), labels,
            test_size=(1 - train_ratio),
            stratify=labels,
            random_state=42,
        )
        # Second split: val vs test (50/50 of the remaining)
        idx_val, idx_test, _, _ = train_test_split(
            idx_temp, y_temp,
            test_size=0.5,
            stratify=y_temp,
            random_state=42,
        )

        # Sort indices to preserve temporal order within each split
        idx_train.sort()
        idx_val.sort()
        idx_test.sort()

        # Create datasets
        train_ds = NetworkFlowDataset(features[idx_train], labels[idx_train], self.seq_len)
        val_ds = NetworkFlowDataset(features[idx_val], labels[idx_val], self.seq_len)
        test_ds = NetworkFlowDataset(features[idx_test], labels[idx_test], self.seq_len)

        return {
            "train": DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0, drop_last=True),
            "val": DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0),
            "test": DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=0),
        }

    def create_cv_dataloaders(
        self,
        features: np.ndarray,
        labels: np.ndarray,
        n_folds: int = None,
        batch_size: int = None,
    ) -> List[Dict[str, DataLoader]]:
        """
        Create K-fold cross-validation DataLoaders.

        Returns:
            List of dicts, each with 'train' and 'val' DataLoader
        """
        n_folds = n_folds or TRAIN_CONFIG["cv_folds"]
        batch_size = batch_size or TRAIN_CONFIG["batch_size"]

        skf = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=42)

        # We need indices that are valid after windowing
        # Use labels from the last position of each window
        valid_indices = np.arange(self.seq_len - 1, len(labels))
        valid_labels = labels[valid_indices]

        folds = []
        for train_idx, val_idx in skf.split(valid_indices, valid_labels):
            # Map back to full dataset indices
            train_start_indices = valid_indices[train_idx] - self.seq_len + 1
            val_start_indices = valid_indices[val_idx] - self.seq_len + 1

            train_ds = NetworkFlowDataset(features, labels, self.seq_len)
            val_ds = NetworkFlowDataset(features, labels, self.seq_len)

            # Use Subset to select specific windows
            train_loader = DataLoader(
                Subset(train_ds, train_idx.tolist()),
                batch_size=batch_size, shuffle=True, num_workers=0, drop_last=True,
            )
            val_loader = DataLoader(
                Subset(val_ds, val_idx.tolist()),
                batch_size=batch_size, shuffle=False, num_workers=0,
            )

            folds.append({"train": train_loader, "val": val_loader})

        return folds

    def get_normalization_stats(self) -> Dict:
        """Return normalization stats for export to TypeScript inference engine."""
        return self.extractor.get_stats_dict()
