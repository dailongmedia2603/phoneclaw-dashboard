#!/bin/bash
# ============================================================
# VPS Initial Setup — Run once on first deploy
# ============================================================
set -e

APP_DIR="/opt/phoneclaw-dashboard"
APP_USER="phoneclaw"

echo "=== PhoneClaw VPS Setup ==="

# Create app directory
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/server/data"

# Install Node.js 20 if not present
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 18 ]]; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install PM2 globally
npm install -g pm2 2>/dev/null || true

# Install nginx
apt install -y nginx 2>/dev/null || true

# Install websockify for noVNC proxy
pip3 install websockify 2>/dev/null || apt install -y python3-pip && pip3 install websockify

# Setup PM2 ecosystem
cat > "$APP_DIR/ecosystem.config.cjs" <<'EOF'
module.exports = {
  apps: [{
    name: 'phoneclaw-dashboard',
    script: 'node',
    args: ['--loader', 'tsx', 'server/index.ts'],
    cwd: '/opt/phoneclaw-dashboard',
    env: {
      NODE_ENV: 'production',
      SERVER_PORT: '9000',
      SERVER_HOST: '0.0.0.0',
    },
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000,
    watch: false,
  }]
};
EOF

# Setup nginx reverse proxy
cat > /etc/nginx/sites-available/phoneclaw <<'NGINX'
server {
    listen 80;
    server_name _;

    client_max_body_size 500M;

    # Dashboard frontend + API
    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    # WebSocket endpoint
    location /ws {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/phoneclaw /etc/nginx/sites-enabled/phoneclaw
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# PM2 startup
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "=== VPS Setup Complete ==="
echo "Dashboard will be available at http://$(curl -s ifconfig.me):80"
