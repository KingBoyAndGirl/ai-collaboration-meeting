#!/bin/bash
# Production deployment script for AI Meeting Platform

set -e

echo "🚀 Deploying AI Meeting Platform to prodbox..."

# Backend
echo "📦 Installing backend dependencies..."
cd /data/code/ai-collaboration-meeting/backend
uv sync

# Run tests
echo "🧪 Running tests..."
uv run pytest tests/ -v

# Frontend build
echo "🏗️ Building frontend..."
cd /data/code/ai-collaboration-meeting
npm run build

echo "✅ Deployment ready!"
echo "Run on prodbox:"
echo "  systemctl --user enable ai-meeting-backend"
echo "  systemctl --user start ai-meeting-backend"