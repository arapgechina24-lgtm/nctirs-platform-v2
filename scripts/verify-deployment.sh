#!/bin/bash
echo "Verifying Environment for Vercel Deployment... (CI Check)"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL is not set."
  echo "   Please set this in Vercel Project Settings."
else
  echo "✅ DATABASE_URL is set."
fi

if [ -z "$TURSO_AUTH_TOKEN" ]; then
  echo "❌ Error: TURSO_AUTH_TOKEN is not set."
  echo "   Please set this in Vercel Project Settings."
else
  echo "✅ TURSO_AUTH_TOKEN is set."
fi

echo "Deployment Check Complete."
