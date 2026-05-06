# AI Meeting Platform - Deployment Guide

## Quick Start (devbox)

### Backend
```bash
cd backend
uv sync
uv run python main.py
# API: http://localhost:18602
```

### Frontend
```bash
cd /data/code/ai-collaboration-meeting
npm install
npm run dev
# Web: http://localhost:18601
```

## Production Deployment (prodbox)

### 1. Systemd Services

Create `/home/prodbox/.config/systemd/user/ai-meeting-backend.service`:
```ini
[Unit]
Description=AI Meeting Platform Backend
After=network.target

[Service]
Type=simple
User=prodbox
WorkingDirectory=/home/prodbox/ai-collaboration-meeting/backend
Environment="HOST=0.0.0.0"
Environment="PORT=18600"
ExecStart=/home/prodbox/ai-collaboration-meeting/backend/.venv/bin/python main.py
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

Create `/home/prodbox/.config/systemd/user/ai-meeting-frontend.service`:
```ini
[Unit]
Description=AI Meeting Platform Frontend
After=network.target

[Service]
Type=simple
User=prodbox
WorkingDirectory=/home/prodbox/ai-collaboration-meeting
ExecStart=/usr/bin/npm run preview
Restart=always

[Install]
WantedBy=default.target
```

### 2. Enable Services
```bash
systemctl --user daemon-reload
systemctl --user enable ai-meeting-backend ai-meeting-frontend
systemctl --user start ai-meeting-backend ai-meeting-frontend
```

### 3. Nginx Reverse Proxy (Optional)

```nginx
server {
    listen 80;
    server_name meeting.example.com;

    location / {
        proxy_pass http://localhost:18601;
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://localhost:18600;
        proxy_set_header Host $host;
    }

    location /ws {
        proxy_pass http://localhost:18600;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| HOST | 0.0.0.0 | Server bind address |
| PORT | 18600 | Backend API port |
| API_KEY | default-key | Single-user auth key |
| LOG_LEVEL | INFO | Logging level |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /api/scenes | List scenes |
| POST | /api/scenes | Create scene |
| GET | /api/meetings | List meetings |
| POST | /api/meetings | Create meeting |
| POST | /api/run/start | Start meeting |
| GET | /api/outputs | List outputs |