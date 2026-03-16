# NCTIRS — National Cyber Threat Intelligence & Response System

**Kenya's AI-Powered Cyber Fusion Center for Real-Time Threat Detection, Attribution, and Automated Response.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Farapgechina24-lgtm%2Fnctirs-platform-v2&env=DATABASE_URL&project-name=nctirs-platform-v2)

---

## 🏛️ Executive Summary

**NCTIRS** is a national-grade Cyber Threat Intelligence and Response System designed to protect Kenya's critical national infrastructure (CNI). Operating as a centralized Command and Control (C2) Fusion Center, it integrates multi-domain intelligence sources — including network telemetry, CCTV surveillance feeds, OSINT data, and historical threat geometry — leveraging Artificial Intelligence to predict, detect, attribute, and neutralize emerging cyber threats in real time.

The platform is built on a three-layer architecture:
- **Perception Layer** — IoT sensors, drone fleet, CCTV feeds, network sniffers
- **Cognition Layer** — ML models, APT signature matching, threat classification (SENTINEL AI)
- **Integrity Layer** — Blockchain ledger, DPA 2019 compliance, evidence chain-of-custody

## 🚀 Core Intelligence Capabilities

### 1. SENTINEL AI — Threat Analysis Engine (Google Gemini)
AI-powered threat and incident analysis with MITRE ATT&CK mapping, Kenya-specific infrastructure context, and structured risk assessments. Falls back to rule-based analysis when offline.

### 2. AURA — Automated Universal Risk Attribution
Python ML backend using Random Forest ensemble models to attribute threats to known APT groups (APT28, Lazarus, APT41, ZINC-24) based on behavioral telemetry patterns.

### 3. Sovereign AI — On-Premise LLM (Ollama)
Local LLM capability via Ollama for threat analysis without external API dependency. Ensures digital sovereignty and data protection compliance under the Data Protection Act 2019.

### 4. Adversarial Defense & Federated Learning
- Gradient masking, noise injection, adversarial training, ensemble voting
- Federated learning across 24+ distributed nodes
- Explainable AI (XAI) transparency panels

### 5. Real-Time NLP & OSINT Sentiment Analysis
NLTK VADER-based sentiment analysis on OSINT feeds for early warning of civil unrest and cyber threat escalation.

### 6. Smart Surveillance (Computer Vision)
YOLOv8 object detection for CCTV threat classification — abandoned bags, weapons, suspicious behavior.

## 💻 Technical Architecture

* **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Shadcn UI, Recharts, Framer Motion
* **Authentication**: NextAuth v5 (JWT + Credentials) with bcrypt password hashing
* **Database**: Prisma ORM (SQLite dev / PostgreSQL production)
* **AI Backend**: Python FastAPI with scikit-learn, NLTK, OpenCV, YOLOv8
* **Real-Time**: Ably WebSocket for live threat alerts
* **AI Models**: Google Gemini 2.0 Flash, Ollama (local LLM), TensorFlow.js anomaly detection
* **Deployment**: Vercel Serverless + Python Functions

## ⚙️ Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/arapgechina24-lgtm/nctirs-platform-v2.git
cd nctirs-platform-v2
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
# Set GEMINI_API_KEY, AUTH_SECRET, DATABASE_URL
npx prisma generate
npx prisma db push
```

### 3. Configure Python ML Environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-local.txt
```

### 4. Launch

```bash
npm run dev           # Next.js frontend
npm run python:dev    # Python AI backend (optional)
```

Access the operational dashboard at [http://localhost:3000](http://localhost:3000).

---

## 🛡️ Strategic Objectives

1. **Algorithmic Threat Anticipation** — Decrease response cycles by forecasting cyber hotspots before escalation
2. **Information Superiority** — Fuse multi-domain indicators into a single C2 pane of glass
3. **Digital Sovereignty** — Indigenous AI models operating on-premise without external black-box dependencies
4. **Operational Excellence** — Zero-Trust architecture, ISO 27001 alignment, DPA 2019 compliance

---

*"In cyber intelligence, time is the only currency that matters. NCTIRS buys time."*
