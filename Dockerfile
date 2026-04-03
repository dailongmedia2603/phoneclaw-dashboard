# ============================================================
# PhoneAgent Dashboard — Multi-stage Docker Build
# Stage 1: Build frontend (Vite + React)
# Stage 2: Production runtime (Node.js + Python)
# ============================================================

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY index.html tsconfig.json vite.config.ts ./
COPY src/ ./src/
COPY public/ ./public/
COPY server/ ./server/

RUN npm run build

# --- Stage 2: Production Runtime ---
FROM node:20-slim
WORKDIR /app

# Install Python3 for OpenCV template matching + curl for healthcheck
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip curl && \
    pip3 install --break-system-packages opencv-python-headless numpy && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install noVNC (for browser-based VNC viewer)
RUN curl -L https://github.com/novnc/noVNC/archive/refs/tags/v1.5.0.tar.gz | tar xz -C /opt && \
    mv /opt/noVNC-1.5.0 /opt/novnc

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm install tsx

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server source + shared types
COPY server/ ./server/
COPY src/types/ ./src/types/
COPY tsconfig.json ./

# Copy deploy scripts
COPY deploy/ ./deploy/

# Create persistent data directories
RUN mkdir -p server/data/screenshots server/data/templates server/data/tenants

# Environment
ENV NODE_ENV=production
ENV NOVNC_PATH=/opt/novnc

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:9000/api/health || exit 1

CMD ["node", "--import", "tsx", "server/index.ts"]
