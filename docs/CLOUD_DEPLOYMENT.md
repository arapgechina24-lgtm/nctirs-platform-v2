# Cloud Environments & CI/CD Configuration

The NSSPIP platform is structured to be flexibly deployed either via Managed Serverless Services or Traditional IaaS configurations.

## 1. Managed Deployment Route (Vercel & NeonDB)

This is the recommended path for rapid prototyping and GitHub synchronization.

### Vercel Deployment configuration

* **Next.js Frontend**: Hosted natively via Vercel's zero-config Next.js Edge Network framework.
* **AI Backend**: Handled via Vercel Serverless Functions (`api/index.py`).
  * **Requires**: `requirements.txt` residing in project root.
  * **Routing**: The `vercel.json` rewrite (`/api/ai/*` -> `/api/index.py`) translates internal framework routing seamlessly.

### Neon PostgreSQL Backend

* Uses a split-connection pool string `DATABASE_URL="postgresql://...&pgbouncer=true"` configured in the `.env` vars in the Vercel Dashboard for scaled serverless database handling.

---

## 2. Infrastructure as a Service (AWS & GCP Free Tier)

For deployments requiring explicit data residency controls.

### AWS Free Tier Architecure

* **Compute (Frontend/Backend)**: EC2 `t2.micro` instance running Docker.
* **Database**: Amazon RDS for PostgreSQL `db.t3.micro`.
* **Configuration**:
    1. Deploy project via Docker Compose mapping Next.js to Port 80 and a discrete Gunicorn/Uvicorn server for the AI container mapping to Port 8000.
    2. Adjust frontend `NEXT_PUBLIC_API_URL` to point to the standalone AI Docker Container running on `t2.micro`.

### GCP Free Tier Architecture

* **Compute**: e2-micro Google Compute Engine instance hosting the Next.js `npm run start` production bundle.
* **Database**: Cloud SQL (requires cost) or Host a local PostgreSQL container directly on the `e2-micro` instance.

## 3. GitHub CI/CD Pipeline

The NSSPIP CI/CD pipeline (`.github/workflows/ci.yml`) is strict but ensures clean environments.

1. **Dependency Generation**: `npm ci` is strictly handled, followed essentially by the `npx prisma generate` command to construct the required Prisma Client binaries for the Ubuntu workflow container.
2. **Linting**: Tests are passed utilizing the custom rules established in `eslint.config.mjs` ensuring high compliance code structures.
3. **Deployments**: Direct pushes are checked. Upon success, branch changes are synchronized across deployment branches allowing auto-build hooks established via Vercel integration.
