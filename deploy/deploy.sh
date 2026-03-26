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
pm2 delete phoneclaw-dashboard 2>/dev/null || true
echo "Starting PM2 process..."
pm2 start deploy/ecosystem.config.cjs

pm2 save

echo "=== Deploy Complete ==="
pm2 status
echo ""
echo "Dashboard: http://$(curl -s ifconfig.me)"
