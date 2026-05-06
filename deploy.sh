#!/bin/bash
# Deployment script for prodbox

set -e

echo "🚀 Deploying AI Meeting Platform..."

# Go to project directory
cd /home/prodbox/ai-collaboration-meeting

# Pull latest code
git pull origin master

# Install frontend dependencies
npm install --silent

# Install backend dependencies
cd backend
uv sync --extra dev --quiet

# Build frontend
cd ..
npm run build --silent

# Restart services
echo "🔄 Restarting services..."
systemctl --user restart ai-meeting-backend 2>/dev/null || true
systemctl --user restart ai-meeting-frontend 2>/dev/null || true

# Show status
echo "✅ Deployment complete!"
echo ""
echo "Services:"
systemctl --user status ai-meeting-backend --no-pager -l 2>/dev/null | head -5 || echo "Backend not running"
echo ""
echo "Access URLs:"
echo "  Frontend: http://localhost:18601"
echo "  Backend:  http://localhost:18600"
echo "  Health:   http://localhost:18600/health"