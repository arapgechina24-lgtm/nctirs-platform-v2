# NCTIRS Platform Architecture

This document outlines the high-level architecture of the National Cyber Threat Intelligence & Reporting System (NCTIRS) Platform.

## System Overview

The application follows a modern full-stack architecture using Next.js for both the frontend and proxy-backend API, integrated with a Python-based AI training and streaming service.

```mermaid
graph TB
    subgraph Client_Layer ["Client Layer (Frontend)"]
        User(["Terminal / Web User"])
        FE["Next.js Dashboard (React / Tailwind)"]
    end

    subgraph Backend_Layer ["Backend Layer (API)"]
        API["Next.js API Routes"]
        Auth["NextAuth.js (Session Management)"]
        RBAC["RBAC (Role Based Access Control)"]
    end

    subgraph Data_Layer ["Data Layer (Storage & ORM)"]
        Prisma["Prisma ORM"]
        DB[("SQLite Database (dev.db)")]
    end

    subgraph AI_Intelligence ["AI Intelligence & Live Feeds"]
        PyTorch["AI Model (LSTM Autoencoder)"]
        Streamer["Live Traffic Streamer (Python)"]
        Datasets["Datasets (CICIDS2017 / UNSW-NB15)"]
    end

    %% Connections
    User <--> FE
    FE <--> API
    API <--> Prisma
    Prisma <-- "Schema Sync" --> DB
    
    %% AI Integration
    Streamer -- "Analyzes" --> Datasets
    Streamer -- "Inference" --> PyTorch
    Streamer -- "POST /api/threats" --> API
    
    %% Security
    Auth -.-> RBAC
    RBAC -.-> API
```

## Core Components

### 1. Frontend (Next.js)

- **UI Framework**: React with Tailwind CSS for a premium, responsive dashboard.
- **State Management**: React Hooks and Context API.
- **Visuals**: Framer Motion for animations and Lucide-React for iconography.

### 2. Backend API

- **Route Handlers**: App Router-based API endpoints for Threats, Incidents, and AI Analytics.
- **Security**: NextAuth.js provides secure authentication.
- **Streaming Bypass**: A custom `x-stream-token` allows the Python streamer to securely push real-time threat data without manual session interaction.

### 3. Data Storage

- **ORM**: Prisma for type-safe database access.
- **Engine**: SQLite for local development and portability.

### 4. AI & Live Data

- **Anomaly Detection Models**: LSTM Autoencoders implemented in PyTorch for network anomaly detection.
- **Local LLM Strategy (Sector-Gapped Sovereign AI)**: While the Hackathon MVP utilizes Google Gemini 2.0 Flash for demonstration, the production rollout architecture mandates a **Sector-Gapped Sovereign AI**. This involves deploying locally hosted, open-weight models (like Llama-3 8B or Mistral) running on secure Kenyan government servers (e.g., Konza Technopolis) completely air-gapped from the public internet. This ensures National Self-Reliance (zero foreign API dependency) and strict Data Privacy compliance.
- **Streaming**: A standalone Python service (`stream_live_traffic.py`) that simulates live network traffic, processes it through the AI models, and pushes detections to the dashboard in real-time.
