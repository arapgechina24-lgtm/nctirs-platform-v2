"""
NCTIRS AI Training Pipeline — LSTM-Autoencoder Model

Production-grade deep anomaly detection model using PyTorch.

Architecture:
  Encoder: Input(46) → Dense(128,ReLU,BN,Drop) → Dense(64,ReLU,BN) → LSTM(32,2L) → Bottleneck(16)
  Decoder: Bottleneck(16) → LSTM(32,2L) → Dense(64,ReLU,BN) → Dense(128,ReLU,BN,Drop) → Output(46)
  + Binary Classification Head for supervised fine-tuning
"""

import torch
import torch.nn as nn
from typing import Tuple, Dict, Optional


class Encoder(nn.Module):
    """Dense → LSTM encoder that compresses 46 features into a latent bottleneck."""

    def __init__(
        self,
        input_dim: int = 46,
        dense_dims: list = None,
        lstm_hidden: int = 32,
        lstm_layers: int = 2,
        bottleneck_dim: int = 16,
        dropout: float = 0.3,
    ):
        super().__init__()
        if dense_dims is None:
            dense_dims = [128, 64]

        # Dense layers with BatchNorm and Dropout
        layers = []
        prev_dim = input_dim
        for i, dim in enumerate(dense_dims):
            layers.append(nn.Linear(prev_dim, dim))
            layers.append(nn.BatchNorm1d(dim))
            layers.append(nn.ReLU(inplace=True))
            if i == 0:  # Dropout only on first layer
                layers.append(nn.Dropout(dropout))
            prev_dim = dim
        self.dense = nn.Sequential(*layers)

        # LSTM for temporal pattern capture
        self.lstm = nn.LSTM(
            input_size=prev_dim,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            dropout=dropout if lstm_layers > 1 else 0,
            bidirectional=False,
        )

        # Bottleneck projection
        self.bottleneck = nn.Sequential(
            nn.Linear(lstm_hidden, bottleneck_dim),
            nn.ReLU(inplace=True),
        )

        self.lstm_hidden = lstm_hidden
        self.lstm_layers = lstm_layers

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            x: (batch, seq_len, input_dim)
        Returns:
            bottleneck: (batch, bottleneck_dim)
            lstm_hidden: tuple of LSTM hidden states
        """
        batch_size, seq_len, _ = x.shape

        # Apply dense layers per timestep
        x_flat = x.reshape(-1, x.shape[-1])  # (batch*seq, input_dim)
        dense_out = self.dense(x_flat)        # (batch*seq, last_dense_dim)
        dense_out = dense_out.reshape(batch_size, seq_len, -1)  # (batch, seq, last_dense_dim)

        # LSTM
        lstm_out, lstm_hidden = self.lstm(dense_out)  # lstm_out: (batch, seq, lstm_hidden)

        # Use last timestep output for bottleneck
        last_out = lstm_out[:, -1, :]  # (batch, lstm_hidden)
        bottleneck = self.bottleneck(last_out)  # (batch, bottleneck_dim)

        return bottleneck, lstm_hidden


class Decoder(nn.Module):
    """Bottleneck → LSTM → Dense decoder that reconstructs the input."""

    def __init__(
        self,
        output_dim: int = 46,
        dense_dims: list = None,
        lstm_hidden: int = 32,
        lstm_layers: int = 2,
        bottleneck_dim: int = 16,
        dropout: float = 0.3,
        seq_len: int = 10,
    ):
        super().__init__()
        if dense_dims is None:
            dense_dims = [64, 128]

        self.seq_len = seq_len

        # Expand bottleneck back to LSTM input
        self.expand = nn.Sequential(
            nn.Linear(bottleneck_dim, lstm_hidden),
            nn.ReLU(inplace=True),
        )

        # Decoder LSTM
        self.lstm = nn.LSTM(
            input_size=lstm_hidden,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            dropout=dropout if lstm_layers > 1 else 0,
        )

        # Dense layers (mirror of encoder)
        layers = []
        prev_dim = lstm_hidden
        for i, dim in enumerate(dense_dims):
            layers.append(nn.Linear(prev_dim, dim))
            layers.append(nn.BatchNorm1d(dim))
            layers.append(nn.ReLU(inplace=True))
            if i == len(dense_dims) - 1:
                layers.append(nn.Dropout(dropout))
            prev_dim = dim
        self.dense = nn.Sequential(*layers)

        # Output projection
        self.output = nn.Linear(prev_dim, output_dim)

    def forward(self, bottleneck: torch.Tensor) -> torch.Tensor:
        """
        Args:
            bottleneck: (batch, bottleneck_dim)
        Returns:
            reconstructed: (batch, seq_len, output_dim)
        """
        batch_size = bottleneck.shape[0]

        # Expand and repeat for sequence
        expanded = self.expand(bottleneck)  # (batch, lstm_hidden)
        expanded = expanded.unsqueeze(1).repeat(1, self.seq_len, 1)  # (batch, seq_len, lstm_hidden)

        # LSTM decoding
        lstm_out, _ = self.lstm(expanded)  # (batch, seq_len, lstm_hidden)

        # Dense per timestep
        out_flat = lstm_out.reshape(-1, lstm_out.shape[-1])  # (batch*seq, lstm_hidden)
        dense_out = self.dense(out_flat)   # (batch*seq, last_dense_dim)
        output = self.output(dense_out)    # (batch*seq, output_dim)
        output = output.reshape(batch_size, self.seq_len, -1)  # (batch, seq_len, output_dim)

        return output


class ClassificationHead(nn.Module):
    """Binary classification head for supervised fine-tuning."""

    def __init__(self, bottleneck_dim: int = 16, num_classes: int = 2):
        super().__init__()
        self.classifier = nn.Sequential(
            nn.Linear(bottleneck_dim, 32),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(32, 16),
            nn.ReLU(inplace=True),
            nn.Linear(16, num_classes),
        )

    def forward(self, bottleneck: torch.Tensor) -> torch.Tensor:
        return self.classifier(bottleneck)


class LSTMAutoencoder(nn.Module):
    """
    Complete LSTM-Autoencoder for Network Anomaly Detection.

    Supports:
      - Unsupervised training (reconstruction loss)
      - Supervised fine-tuning (classification loss)
      - Combined training (weighted sum of both losses)
    """

    def __init__(
        self,
        input_dim: int = 46,
        encoder_dims: list = None,
        decoder_dims: list = None,
        lstm_hidden: int = 32,
        lstm_layers: int = 2,
        bottleneck_dim: int = 16,
        dropout: float = 0.3,
        seq_len: int = 10,
        num_classes: int = 2,
        use_classification_head: bool = True,
    ):
        super().__init__()

        if encoder_dims is None:
            encoder_dims = [128, 64]
        if decoder_dims is None:
            decoder_dims = [64, 128]

        self.encoder = Encoder(
            input_dim=input_dim,
            dense_dims=encoder_dims,
            lstm_hidden=lstm_hidden,
            lstm_layers=lstm_layers,
            bottleneck_dim=bottleneck_dim,
            dropout=dropout,
        )

        self.decoder = Decoder(
            output_dim=input_dim,
            dense_dims=decoder_dims,
            lstm_hidden=lstm_hidden,
            lstm_layers=lstm_layers,
            bottleneck_dim=bottleneck_dim,
            dropout=dropout,
            seq_len=seq_len,
        )

        self.use_classification_head = use_classification_head
        if use_classification_head:
            self.classification_head = ClassificationHead(
                bottleneck_dim=bottleneck_dim,
                num_classes=num_classes,
            )

        self._input_dim = input_dim
        self._bottleneck_dim = bottleneck_dim
        self._seq_len = seq_len

    def forward(
        self, x: torch.Tensor
    ) -> Dict[str, torch.Tensor]:
        """
        Args:
            x: (batch, seq_len, input_dim)
        Returns:
            dict with:
              - 'reconstruction': (batch, seq_len, input_dim)
              - 'bottleneck': (batch, bottleneck_dim)
              - 'classification': (batch, num_classes) [if classification head is enabled]
        """
        bottleneck, _ = self.encoder(x)
        reconstruction = self.decoder(bottleneck)

        result = {
            "reconstruction": reconstruction,
            "bottleneck": bottleneck,
        }

        if self.use_classification_head:
            result["classification"] = self.classification_head(bottleneck)

        return result

    def compute_reconstruction_error(self, x: torch.Tensor) -> torch.Tensor:
        """Compute per-sample reconstruction error (MSE)."""
        with torch.no_grad():
            output = self.forward(x)
            recon = output["reconstruction"]
            # MSE per sample
            error = ((x - recon) ** 2).mean(dim=(1, 2))
        return error

    def get_architecture_info(self) -> Dict:
        """Return model architecture metadata for export."""
        total_params = sum(p.numel() for p in self.parameters())
        trainable_params = sum(p.numel() for p in self.parameters() if p.requires_grad)
        return {
            "model_type": "LSTM-Autoencoder",
            "input_dim": self._input_dim,
            "bottleneck_dim": self._bottleneck_dim,
            "sequence_length": self._seq_len,
            "total_parameters": total_params,
            "trainable_parameters": trainable_params,
            "has_classification_head": self.use_classification_head,
            "encoder_layers": str(self.encoder),
            "decoder_layers": str(self.decoder),
        }


def build_model(config: dict) -> LSTMAutoencoder:
    """Factory function to build model from config dict."""
    return LSTMAutoencoder(
        input_dim=config.get("input_dim", 46),
        encoder_dims=config.get("encoder_dims", [128, 64]),
        decoder_dims=config.get("decoder_dims", [64, 128]),
        lstm_hidden=config.get("lstm_hidden", 32),
        lstm_layers=config.get("lstm_layers", 2),
        bottleneck_dim=config.get("bottleneck_dim", 16),
        dropout=config.get("dropout", 0.3),
        seq_len=config.get("sequence_length", 10),
        num_classes=2,
        use_classification_head=config.get("classification_head", True),
    )
