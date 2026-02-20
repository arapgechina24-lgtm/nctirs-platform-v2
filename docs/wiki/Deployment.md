# Deployment Guide

## Prerequisites

- Node.js 18.x or later.
- Vercel CLI (optional).
- Turso Database (LibSQL).
- Gemini API Key.

## Local Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/arapgechina24-lgtm/nctirs-platform-v2.git
   cd nctirs-platform-v2
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment**
   Duplicate `.env.example` to `.env.local` and fill in:
   - `GEMINI_API_KEY`: Google AI Studio key.
   - `AUTH_SECRET`: Generate with `openssl rand -base64 32`.
   - `DATABASE_URL`: Turso connection string.
   - `TURSO_AUTH_TOKEN`: Turso auth token.
   - `DEPLOYMENT_PASSWORD` (Optional): Basic Auth lock.

4. **Run Development Server**

   ```bash
   npm run dev
   ```

## Vercel Deployment

The project is optimized for Vercel.

1. **Import Project**: Select the GitHub repository.
2. **Environment Variables**: Add all variables from `.env.local`.
3. **Deploy**: Click Deploy. The build command `npm run build` will handle optimization.

### Lockdown Mode

To protect a deployment (e.g., for internal review), set `DEPLOYMENT_PASSWORD` in Vercel settings. This enables Basic Auth middleware.
