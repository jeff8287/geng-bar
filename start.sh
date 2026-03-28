#!/bin/bash
set -e

echo "============================================"
echo "  庚 Bar - Home Cocktail Bar"
echo "============================================"
echo ""

# 1. Build frontend
echo "[1/3] Building frontend..."
cd "$(dirname "$0")/frontend"
npm install --silent 2>/dev/null
npm run build
cd ..
echo "  ✓ Frontend built"

# 2. Start Docker services
echo "[2/3] Starting services..."
docker compose up -d --build
echo "  ✓ Services started"

# 3. Wait for backend to be ready
echo "[3/3] Waiting for backend..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        break
    fi
    sleep 1
done
echo "  ✓ Backend ready"

# Get LAN IP
LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$LAN_IP" ]; then
    LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "YOUR_IP")
fi

echo ""
echo "============================================"
echo "  庚 Bar is running!"
echo ""
echo "  PC:   http://localhost:8000"
echo "  Phone: http://${LAN_IP}:8000"
echo ""
echo "  Share the phone URL with your guests!"
echo "============================================"
