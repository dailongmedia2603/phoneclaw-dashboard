#!/bin/bash
# ============================================================
# Deploy PhoneClaw Dashboard to VPS
# Called by GitHub Actions after build
# ============================================================
set -e

APP_DIR="/opt/phoneclaw-dashboard"

echo "=== Deploying PhoneClaw Dashboard ==="

cd "$APP_DIR"

# Install dependencies
npm install --omit=dev 2>&1 | tail -5

# Install tsx for running TypeScript server
npm install tsx 2>&1 | tail -3

# Restart with PM2
if pm2 describe phoneclaw-dashboard > /dev/null 2>&1; then
    echo "Restarting existing PM2 process..."
    pm2 restart phoneclaw-dashboard
else
    echo "Starting new PM2 process..."
    pm2 start ecosystem.config.cjs
fi

pm2 save

echo "=== Deploy Complete ==="
pm2 status
echo ""
echo "Dashboard: http://$(curl -s ifconfig.me)"
