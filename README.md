# USALAMA APP – Unified Security & Law-enforcement Alert Management Architecture

**A citizen-centric incident reporting portal integrated with the National Security Strategy & Policy Integration Platform (NSSPIP).**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Farapgechina24-lgtm%2FNSSPIP&env=DATABASE_URL&project-name=nsspip)

---

## 🏛️ Executive Summary

**USALAMA APP** is the official citizen-facing reporting module of the Kenyan National Security ecosystem. It provides a secure, encrypted channel for citizens to report suspicious activity, cyber threats, and physical incidents directly to the National Command Center.

Built to the standards of top-tier intelligence agencies (like the NIS or CIA), NSSPIP serves as a centralized Command and Control (C2) Fusion Center. It seamlessly integrates multi-domain data sources—including CCTV surveillance feeds, public OSINT data, and historical crime geometry—leveraging Artificial Intelligence to predict, detect, and neutralize emerging asymmetric threats.

By fusing State-of-the-Art Machine Learning architectures into a highly optimized Hybrid Serverless Environment, the platform empowers commanders with real-time Situational Awareness, Predictive Policing matrices, and rapid Emergency Response coordination.

## 🚀 Core Intelligence Capabilities

The NSSPIP platform is powered by a robust Python Machine Learning backend seamlessly integrated with a high-performance Next.js 14 frontend dashboard.

### 1. Predictive Risk Engine (Machine Learning Forensics)

Utilizing a highly optimized **Random Forest Regressor** (`scikit-learn`), the platform analyzes historical incident geometry, regional density hotspots, and temporal patterns.

* **Capability**: Commanders can dynamically execute real-time risk assessments on active incidents. The AI infers geospatial variables to output a distinct `Risk Score` (0-100) and discrete contributing factors, allowing automated prioritization of kinetic response teams.

### 2. Live Operational Intelligence & OSINT Sentiment (NLP)

Integrating the **Natural Language Toolkit (NLTK) VADER Lexicon** and continuous web scraping architectures (`BeautifulSoup4`).

* **Capability**: The engine autonomously ingests open-source intelligence (OSINT), such as global news RSS feeds (e.g., Al Jazeera unrest reporting) or raw dispatch text. It isolates critical security keywords and grades the operational sentiment volatility (POSITIVE, NEGATIVE, NEUTRAL) to construct an Aggregate Threat Level for early warning of civil unrest.

### 3. Smart Surveillance & Object Detection (Computer Vision)

Deploying lightweight **YOLOv8** (You Only Look Once) neural networks interfaced with **OpenCV**.

* **Capability**: Operates a realtime scanning overlay for available CCTV nodes. The computer vision pipeline isolates specific threat classes—such as abandoned bags or visible weapons—generating high-confidence alerts and rendering targeted bounding boxes directly into the command interface.

## 💻 Technical Architecture & Stack

NSSPIP is built for absolute resilience, scaling, and zero-trust security.

* **Frontend C2 Interface**: Next.js 14 (App Router), React, Tailwind CSS, Shadcn UI, Recharts for dynamic telemetry.
* **Serverless AI Backend**: Python 3.9 natively routed within Next.js API paths (`/api/ai/*`), ensuring seamless internal API gating.
* **Machine Learning Ecosystem**: PyTorch, Ultralytics YOLO, Scikit-Learn, Pandas, NLTK, OpenCV.
* **Deployment**: Vercel Serverless Functions with dynamically decoupled ML dependencies for rapid cold starts.

## ⚙️ Getting Started (Local Development)

To initialize the Fusion Center for local operations and development testing:

### 1. Clone & Install Next.js Dependencies

```bash
git clone https://github.com/arapgechina24-lgtm/NSSPIP.git
cd NSSPIP
npm install
```

### 2. Configure Python ML Environment

Due to the heavy weight of Deep Learning models (YOLO/PyTorch), local testing requires an isolated Python virtual environment.

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-local.txt
```

### 3. Launch Development Server

```bash
npm run dev
# OR launch the Python fastAPI backend independently
npm run python:dev
```

Access the operational dashboard at [http://localhost:3000](http://localhost:3000).

---

## 🛡️ Strategic Objectives & Impact

1. **Algorithmic Threat Anticipation**: Decrease average emergency response cycles by forecasting hotspots prior to kinetic escalation.
2. **Information Superiority**: Break down intelligence silos by fusing multi-domain indicators into a single pane of glass for Strategic Commanders.
3. **Digital Sovereignty & Security**: Develop indigenous, adaptable AI models capable of operating securely without continuous reliance on external black-box APIs.
4. **Operational Excellence**: Adheres to strict Zero-Trust and code quality governance methodologies, ensuring the platform remains auditable and legally compliant.

---
*“In intelligence, time is the only currency that matters. NSSPIP buys time.”*
