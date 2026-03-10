# Vercel Deployment Checklist

This document details the critical environment variables that must be set in your Vercel Project Settings for the platform to function.

## Required Environment Variables

| Variable Name   | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL`  | Connection string to your PostgreSQL instance (e.g., Neon or Supabase). Requires the connection pooling URL if using Prisma. | `postgresql://user:password@host/db?pgbouncer=true` |
| `AUTH_SECRET`   | A random 32-byte string used to encrypt session tokens. Generate with `openssl rand -base64 32`. | `your-secure-base64-secret` |
| `NEXTAUTH_URL`  | The canonical URL of your Vercel deployment. (Usually auto-populated by Vercel, but required for NextAuth) | `https://your-project.vercel.app` |

### Setting Environment Variables in Vercel

1. Go to your Vercel Dashboard.
2. Select your `ai-policing-platform` project.
3. Navigate to **Settings** > **Environment Variables**.
4. Add the variables listed above. Ensure they are available for the `Production` and `Preview` environments.
5. Trigger a new deployment to apply the environment variables.
