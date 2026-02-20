# API Reference

The NCTIRS Platform exposes a RESTful API for integration.

## Base URL

`/api`

## Authentication

Most endpoints require a valid session (NextAuth.js) or API Key (for external agents).

---

## Endpoints

### 1. Incidents

#### `GET /api/incidents`

- **Description**: Fetch recent incidents.
- **Query Params**: `limit`, `type`, `severity`.
- **Response**: Array of Incident objects.

#### `POST /api/incidents`

- **Description**: Report a new incident.
- **Body**: `{ title: string, type: string, severity: 'HIGH'|'MEDIUM'|'LOW' }`
- **Auth**: Required.

### 2. Threat Intelligence

#### `GET /api/threats`

- **Description**: Retrieve active threats.
- **Response**: Array of Threat objects.

### 3. AI Analysis

#### `POST /api/ai/analyze`

- **Description**: Analyze raw logs or text for threats.
- **Body**: `{ text: string }`
- **Response**: `{ analysis: string, threatLevel: number }`

#### `POST /api/ai/mitre`

- **Description**: Classify IOCs against MITRE ATT&CK framework.
- **Body**: `{ iocs: string[] }`
- **Response**: `{ classifications: MitreClassification[] }`

### 4. Audit Logs

#### `GET /api/audit`

- **Description**: Fetch immutable audit trail.
- **Response**: Chain of log entries with cryptographic hashes.
