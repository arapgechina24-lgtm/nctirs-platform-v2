#!/bin/bash

# NCTIRS - Sovereign AI Setup Script
# Purpose: Deploy locally-hosted Llama-3 model for data sovereignty compliance.

echo "🛡️  NCTIRS Sovereign AI Deployment Initializing..."

# 1. Check for Ollama
if ! command -v ollama &> /dev/null
then
    echo "❌ Ollama not found. Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "✅ Ollama detected."
fi

# 2. Start Ollama in background if not running
echo "🚀 Starting Ollama service..."
ollama serve > /dev/null 2>&1 &
sleep 5

# 3. Pull Llama-3-8B (The National Security baseline model)
echo "📥 Pulling Llama-3 (8B) model... This may take a few minutes."
ollama pull llama3:8b

# 4. Verify Model
if ollama list | grep -q "llama3:8b"
then
    echo "✅ Llama-3:8B successfully deployed to Sovereign Core."
else
    echo "❌ Model pull failed. Please check your internet connection."
    exit 1
fi

# 5. Export Env Vars for Next.js
echo "⚙️  Configuring environment variables..."
echo "SOVEREIGN_AI_ENABLED=true" >> .env.local
echo "OLLAMA_ENDPOINT=http://localhost:11434" >> .env.local
echo "OLLAMA_MODEL=llama3:8b" >> .env.local

echo "✨ Sovereign AI Infrastructure is ONLINE."
echo "NCTIRS is now running in 100% Data Sovereignty Mode."
