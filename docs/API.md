# System API Documentation

The backend consists of two integrated layers:

1. **Next.js Server API (`/api/nctirs/*`)**: Manages business logic, database mutations (via Prisma), and authentications.
2. **Serverless Python AI Engine (`/api/ai/*`)**: Written in FastAPI, these endpoints manage AI inferences mapped seamlessly by Vercel Rewrites.

## AI Engine Endpoints

### 1. Risk Scoring

* **Endpoint:** `POST /api/ai/predict/risk-score`
* **Description:** Calculates the likelihood of a high-risk event based on geospatial location.

**Request Body (`application/json`)**

```json
{
  "latitude": -1.282,
  "longitude": 36.821,
  "time_of_day": "night"
}
```

**Response (`200 OK`)**

```json
{
  "risk_score": 77,
  "risk_level": "HIGH",
  "contributing_factors": [
    "Historical crime density high",
    "Poor lighting reported",
    "Proximity to high-value target"
  ]
}
```

### 2. Live Surveillance Analysis

* **Endpoint:** `POST /api/ai/analyze/surveillance`
* **Description:** Processes frames from CCTV feeds to identify weapons or abandoned bags.

**Request Body (`application/json`)**

```json
{
  "feed_id": "cctv_nrb_cbd_04",
  "image_url": "base64_encoded_or_url"
}
```

**Response (`200 OK`)**

```json
{
  "feed_id": "cctv_nrb_cbd_04",
  "timestamp": "2024-03-24T12:00:00.000000",
  "detected_objects": [
    {
      "label": "abandoned_bag",
      "confidence": 0.89,
      "bbox": [100, 200, 50, 50]
    }
  ],
  "alert_triggered": true
}
```

### 3. Intelligence Sentiment

* **Endpoint:** `POST /api/ai/analyze/sentiment`
* **Description:** Assesses the volatility or safety sentiment of unstructured intelligence reports.

**Query Parameter**

* `text` (string): The text to analyze.

**Response (`200 OK`)**

```json
{
  "text_preview": "The protest turned violent after an armed dispute...",
  "sentiment": "NEGATIVE",
  "score": -2
}
```
