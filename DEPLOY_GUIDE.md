# Deployment Guide

## 🚀 The Easiest Way: Admin Dashboard Import

Since you already have the code on GitHub, you don't need to "Clone" it. You just need to **Import** it.

1. **Log in to Vercel**: Go to [vercel.com/dashboard](https://vercel.com/dashboard).
2. **Add New Project**: Click the **"Add New..."** button (top right) -> Select **"Project"**.
3. **Select Repository**:
    * You should see `NSSPIP` in the list of your repositories.
    * Click the **Import** button next to it.
4. **Configure Project**:
    * **Project Name**: Leave as `nsspip` (or whatever it suggests).
    * **Framework Preset**: It should auto-detect `Next.js`.
    * **Root Directory**: Leave as `./`.
5. **Environment Variables (Crucial)**:
    * Expand the **"Environment Variables"** section.
    * **Key**: `DATABASE_URL`
    * **Value**: *[Your Connection String]*
        * *Example*: `postgres://username:password@ep-shiny-glade.aws.neon.tech/neondb...`
        * (You must get this from a database provider like [Neon.tech](https://neon.tech) or Vercel Postgres).
6. **Deploy**: Click **Deploy**.

## Database Setup (Post-Deployment)

Once deployed, populate your cloud database:

```bash
# In your local terminal
export DATABASE_URL="<your-cloud-connection-string>"
npx prisma db push
npm run seed
```
