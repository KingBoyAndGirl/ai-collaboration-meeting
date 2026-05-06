#!/bin/bash
# Deployment script for prodbox

set -e

# Pull latest code
cd /home/prodbox/ai-collaboration-meeting
git pull origin master

# Install deps
npm install 2>/dev/null || true
uv sync --extra dev 2>/dev/null || true

# Restart services (if using systemd)
# systemctl restart ai-meeting-frontend
# systemctl restart ai-meeting-backend

echo "✅ Deployment complete"
echo "Frontend: npm run dev"
echo "Backend: uv run uvicorn main:app --host 0.0.0.0 --port 18600"