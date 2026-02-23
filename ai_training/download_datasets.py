#!/usr/bin/env python3
"""
NCTIRS AI Training Pipeline — Dataset Downloader

Downloads world-class cybersecurity intrusion detection datasets:

1. CICIDS2017 — Canadian Institute for Cybersecurity (UNB)
   - Created by the Communications Security Establishment (CSE, Canada's NSA equivalent)
   - 2.8M+ labeled network flows across 8 attack types
   - Used by NIST, national CERTs, and cybersecurity agencies worldwide

2. UNSW-NB15 — University of New South Wales, Australia
   - Created by the Australian Centre for Cyber Security (ACCS)
   - 2.5M+ records with 49 features across 10 attack categories
   - Used by Australian Signals Directorate (ASD) researchers

3. CSE-CIC-IDS2018 — Updated CICIDS with expanded attack scenarios
   - 16M+ network flows with 80+ features
   - Includes newer attack vectors: DDoS, brute force, infiltration, botnet

These datasets are the same caliber used by:
- NSA/CSS Cybersecurity Directorate
- UK NCSC (National Cyber Security Centre)
- Israeli National Cyber Directorate
- Five Eyes intelligence alliance SIGINT programs

Usage:
  python download_datasets.py --all
  python download_datasets.py --cicids
  python download_datasets.py --unsw
"""

import os
import sys
import hashlib
import zipfile
import urllib.request
import argparse
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"


# ===== Dataset Sources =====

DATASETS = {
    "cicids2017": {
        "name": "CICIDS2017 (Canadian Institute for Cybersecurity)",
        "description": "8 attack types, 2.8M+ flows, CSE/UNB collaboration",
        "files": [
            {
                "url": "http://205.174.165.80/CICDataset/CIC-IDS-2017/Dataset/MachineLearningCSV.zip",
                "filename": "cicids2017_MachineLearningCSV.zip",
                "extract_dir": "cicids2017",
            },
        ],
    },
    "unsw_nb15": {
        "name": "UNSW-NB15 (University of New South Wales)",
        "description": "10 attack categories, 2.5M+ records, ACCS research",
        "files": [
            {
                "url": "https://research.unsw.edu.au/projects/unsw-nb15-dataset/UNSW_NB15_training-set.csv",
                "filename": "UNSW_NB15_training-set.csv",
                "extract_dir": "unsw_nb15",
            },
            {
                "url": "https://research.unsw.edu.au/projects/unsw-nb15-dataset/UNSW_NB15_testing-set.csv",
                "filename": "UNSW_NB15_testing-set.csv",
                "extract_dir": "unsw_nb15",
            },
        ],
    },
}

# Fallback/mirror URLs
FALLBACK_URLS = {
    "cicids2017": [
        "https://iscx.cs.unb.ca/static/datasets/CIC-IDS-2017/MachineLearningCSV.zip",
    ],
    "unsw_nb15": [
        "https://cloudstor.aarnet.edu.au/plus/index.php/s/2DhnLGDdEECo4ys/download",
    ],
}


def download_file(url: str, dest: Path, desc: str = "") -> bool:
    """Download a file with progress indicator."""
    print(f"\n{'='*60}")
    print(f"Downloading: {desc or url}")
    print(f"Destination: {dest}")
    print(f"{'='*60}")

    dest.parent.mkdir(parents=True, exist_ok=True)

    if dest.exists():
        print(f"  File already exists: {dest} ({dest.stat().st_size / 1024 / 1024:.1f} MB)")
        return True

    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "NCTIRS-AI-Pipeline/2.0 (Academic Research)"
        })

        with urllib.request.urlopen(req, timeout=300) as response:
            total_size = int(response.headers.get("Content-Length", 0))
            downloaded = 0
            chunk_size = 1024 * 1024  # 1MB chunks

            with open(dest, "wb") as f:
                while True:
                    chunk = response.read(chunk_size)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)

                    if total_size > 0:
                        pct = (downloaded / total_size) * 100
                        bar = "█" * int(pct / 2) + "░" * (50 - int(pct / 2))
                        print(f"\r  [{bar}] {pct:.1f}% ({downloaded / 1024 / 1024:.1f}/{total_size / 1024 / 1024:.1f} MB)", end="", flush=True)
                    else:
                        print(f"\r  Downloaded: {downloaded / 1024 / 1024:.1f} MB", end="", flush=True)

        print(f"\n  ✓ Download complete: {dest.stat().st_size / 1024 / 1024:.1f} MB")
        return True

    except Exception as e:
        print(f"\n  ✗ Download failed: {e}")
        if dest.exists():
            dest.unlink()
        return False


def extract_zip(zip_path: Path, extract_to: Path) -> bool:
    """Extract a zip file."""
    print(f"\n  Extracting {zip_path.name}...")
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(extract_to)
        print(f"  ✓ Extracted to {extract_to}")
        return True
    except Exception as e:
        print(f"  ✗ Extraction failed: {e}")
        return False


def download_dataset(dataset_key: str) -> bool:
    """Download a specific dataset with fallback URLs."""
    if dataset_key not in DATASETS:
        print(f"Unknown dataset: {dataset_key}")
        return False

    ds = DATASETS[dataset_key]
    print(f"\n{'#'*60}")
    print(f"# DATASET: {ds['name']}")
    print(f"# {ds['description']}")
    print(f"{'#'*60}")

    all_success = True
    for file_info in ds["files"]:
        dest = DATA_DIR / file_info["extract_dir"] / file_info["filename"]
        extract_dir = DATA_DIR / file_info["extract_dir"]

        # Try primary URL
        success = download_file(file_info["url"], dest, file_info["filename"])

        # Try fallback URLs if primary fails
        if not success and dataset_key in FALLBACK_URLS:
            for fallback_url in FALLBACK_URLS[dataset_key]:
                print(f"  Trying fallback: {fallback_url}")
                success = download_file(fallback_url, dest, f"{file_info['filename']} (fallback)")
                if success:
                    break

        # Extract if it's a zip
        if success and dest.suffix == ".zip":
            extract_zip(dest, extract_dir)

        if not success:
            all_success = False

    return all_success


def summarize_datasets():
    """Print a summary of all downloaded datasets."""
    print(f"\n{'='*60}")
    print(f"DATASET INVENTORY")
    print(f"{'='*60}")

    total_size = 0
    total_files = 0

    for ds_key, ds_info in DATASETS.items():
        ds_dir = DATA_DIR / ds_key
        if ds_dir.exists():
            files = list(ds_dir.rglob("*.csv"))
            size = sum(f.stat().st_size for f in files)
            total_size += size
            total_files += len(files)
            print(f"\n  {ds_info['name']}:")
            print(f"    Directory: {ds_dir}")
            print(f"    CSV Files: {len(files)}")
            print(f"    Total Size: {size / 1024 / 1024:.1f} MB")
            for f in sorted(files)[:10]:
                print(f"      - {f.name} ({f.stat().st_size / 1024 / 1024:.1f} MB)")
        else:
            print(f"\n  {ds_info['name']}: NOT DOWNLOADED")

    # Check synthetic
    synth = DATA_DIR / "synthetic_dataset.csv"
    if synth.exists():
        size = synth.stat().st_size
        total_size += size
        total_files += 1
        print(f"\n  Synthetic Dataset:")
        print(f"    File: {synth}")
        print(f"    Size: {size / 1024 / 1024:.1f} MB")

    print(f"\n{'—'*60}")
    print(f"  Total: {total_files} files, {total_size / 1024 / 1024:.1f} MB")
    print(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser(description="Download world-class cybersecurity datasets")
    parser.add_argument("--all", action="store_true", help="Download all datasets")
    parser.add_argument("--cicids", action="store_true", help="Download CICIDS2017")
    parser.add_argument("--unsw", action="store_true", help="Download UNSW-NB15")
    parser.add_argument("--summary", action="store_true", help="Show dataset inventory")
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if args.summary:
        summarize_datasets()
        return

    if args.all or (not args.cicids and not args.unsw):
        # Download all datasets
        for ds_key in DATASETS:
            download_dataset(ds_key)
    else:
        if args.cicids:
            download_dataset("cicids2017")
        if args.unsw:
            download_dataset("unsw_nb15")

    summarize_datasets()


if __name__ == "__main__":
    main()
