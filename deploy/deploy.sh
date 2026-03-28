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

# Update nginx upload limit
if grep -q "client_max_body_size" /etc/nginx/sites-available/phoneclaw 2>/dev/null; then
  echo "Nginx upload limit already configured"
else
  sed -i '/location \/ {/i\    client_max_body_size 500M;' /etc/nginx/sites-available/phoneclaw 2>/dev/null || true
  nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
  echo "Nginx upload limit set to 500M"
fi

# Restart with PM2
pm2 delete phoneclaw-dashboard 2>/dev/null || true
echo "Starting PM2 process..."
pm2 start deploy/ecosystem.config.cjs

pm2 save

echo "=== Deploy Complete ==="
pm2 status
echo ""
echo "Dashboard: http://$(curl -s ifconfig.me)"
