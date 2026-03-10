# $1M SaaS Deployment Guide

## Production Architecture

For the $1M ARR SaaS iteration of NCTIRS, we have decoupled the Next.js Frontend from the computationally heavy Python AI backend.

### 1. Frontend: Vercel

The Next.js Application is optimized for deployment on Vercel Edge networks.

**Steps:**

1. Connect this GitHub repository to your Vercel account.
2. In the Vercel dashboard, verify the `root` directory is the standard repo root.
3. Configure Environment Variables:
   - `DATABASE_URL`: Your production PostgreSQL string (e.g. Supabase or RDS).
   - `NEXTAUTH_SECRET`: Generate using `openssl rand -base64 32`
   - `NEXTAUTH_URL`: `https://your-production-domain.com`
   - `NEXT_PUBLIC_AI_API_URL`: `https://ai.nctirs-saas.com` (Your Python backend URL).

### 2. Backend (FastAPI + AI Models): AWS EC2 / Render

Because the YOLOv8 and scikit-learn random forest models require heavy memory usage and optionally GPUs, deploy the Python backend on a dedicated compute instance rather than serverless functions.

#### Option A: Render (Easiest)

1. Connect the repository to Render, create a new "Web Service".
2. Set the Root Directory to `api`.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Option B: AWS EC2 (Most Scalable)

1. Spin up a `g4dn.xlarge` instance (if using GPU for YOLOv8) or `t3.large`.
2. Clone the repository and navigate to `api/`.
3. Install requirements and use `gunicorn` with `uvicorn` workers for production routing.

### 3. Database: Neon / Supabase / AWS RDS

We've migrated to standard PostgreSQL via Prisma ORM for type-safe database calls. Set up your production Postgres DB, then locally run:
`npx prisma migrate deploy` to push the schema containing `Incidents` and `Threats`.
