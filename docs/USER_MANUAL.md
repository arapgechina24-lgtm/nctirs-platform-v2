# NSSPIP User Manual

**AI-Powered National Security & Smart Policing Intelligence Platform**

## 1. Introduction

Welcome to NSSPIP. This platform leverages AI to predict threats, monitor surveillance feeds, and coordinate incident responses.

## 2. Accessing the System

- **URL**: `http://localhost:3000` (Dev) / `https://nsspip.gov.ke` (Prod)
- **Login**: Use your secure credentials.
  - *Demo Admin*: `admin@nss.go.ke` / (No password for dev auth)

## 3. Command Dashboard

The dashboard provides a real-time operational picture.

- **Risk Score**: Top-right card showing the current AI-assessed threat level (0-100).
- **Incident Map**: Main view displaying active incidents. Red markers indicate `CRITICAL` priority.
- **Camera Feeds**: Live surveillance grid. Alerts appear automatically if the AI detects weapons or abandoned objects.

## 4. Incident Management

### Reporting

1. Navigate to **Incidents > New Incident**.
2. Fill in the Title, Priority, and Description.
3. Use the Map to pin the exact location.
4. Click **Submit**.

### Managing

1. Click on an incident in the list to view details.
2. Use the **Update Status** button to change from `OPEN` to `IN_PROGRESS` or `RESOLVED`.

## 5. Community App (Citizen Reporting)

- **URL**: `/community/report`
- **Usage**:
  1. Accessibility: Mobile-optimized for citizens.
  2. **Location**: Click "Use My Current Location" for GPS tagging.
  3. **Privacy**: Metrics are anonymized; personal details are encrypted.

## 6. Troubleshooting

- **Missing AI Data**: Ensure the Python AI Engine is running on port 8000.
- **Location Error**: Enable GPS permissions in your browser.
