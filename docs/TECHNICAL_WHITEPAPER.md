# NSSPIP Technical Whitepaper

**AI-Powered National Security & Smart Policing Intelligence Platform**

## 1. Architecture Overview

NSSPIP operates on a microservices architecture designed for scalability and security.

### 1.1 Frontend (Dashboard)

- **Framework**: Next.js 14 (React) with TypeScript.
- **Styling**: Tailwind CSS + Shadcn UI.
- **State Management**: Server Actions + React Hook Form.

### 1.2 AI Engine (Backend)

- **Service**: Python FastAPI.
- **capabilities**:
  - **Predictive Modeling**: Random Forest / LSTM (Mocked for MVP) to calculate geo-spatial risk scores.
  - **Computer Vision**: Analysis of RTSP/HTTP video feeds for object detection (YOLOv8 logic).
  - **NLP**: Sentiment analysis of text reports.

### 1.3 Data Layer

- **Database**: PostgreSQL with PostGIS extension support.
- **ORM**: Prisma.
- **Security**: "Zero PII" policy. Columns like `encryptedDetails` store sensitive info as encrypted blobs (AES-256 simulation).

## 2. Security & Compliance

### 2.1 Kenya Data Protection Act (2019)

- **Data Minimization**: Only necessary metadata is exposed to analysts.
- **Encryption**: Data at rest is encrypted.
- **Audit Logs**: All officer actions (viewing intelligence, updating incidents) are logged ( Roadmap feature).

## 3. AI Methodology

- **Risk Scoring**:
  - Inputs: Historical crime density, time of day, proximity to critical infrastructure.
  - Output: 0-100 Score.
  - Triggers: Scores > 70 trigger "HIGH" alert state on the dashboard.

## 4. Deployment

- **Containerization**: Docker support for all services.
- **CI/CD**: GitHub Actions pipeline for automated testing and semantic versioning.
