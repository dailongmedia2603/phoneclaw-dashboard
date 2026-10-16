export const config = {
  port: parseInt(process.env.SERVER_PORT || '9000'),
  host: process.env.SERVER_HOST || '0.0.0.0',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],

  // VNC proxy ports start from this number, one per device
  vncProxyPortStart: parseInt(process.env.VNC_PROXY_PORT_START || '6081'),

  // Device health check interval (ms)
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '15000'),

  // Device HTTP API timeout (ms)
  deviceApiTimeout: parseInt(process.env.DEVICE_API_TIMEOUT || '10000'),

  // Heartbeat staleness threshold: mark offline if no heartbeat received within this time (ms)
  // Must be > 2x phone heartbeat interval (phone sends every 30s → threshold 90s)
  heartbeatStaleThreshold: parseInt(process.env.HEARTBEAT_STALE_THRESHOLD || '90000'),

  // Staleness checker interval: how often to scan for stale devices (ms)
  stalenessCheckInterval: parseInt(process.env.STALENESS_CHECK_INTERVAL || '30000'),

  // VPS heartbeat URL — phones will POST heartbeats to this URL
  // Set to your VPS Tailscale IP, e.g. "http://100.64.0.1:9000/api/heartbeat"
  heartbeatUrl: process.env.HEARTBEAT_URL || '',

  // WireGuard hub (thay Tailscale) — xem server/services/wireguard.ts
  // Dữ liệu dùng chung với container `wireguard` (peers.json, server.pub, status.txt)
  wgDataDir: process.env.WG_DATA_DIR || './server/data/wireguard',
  // Địa chỉ điện thoại dùng để kết nối tới VPS (host:port, host có thể là domain)
  wgEndpoint: process.env.WG_ENDPOINT || 'phoneagent.io.vn:51830',
  wgServerIp: '10.88.0.1',
  wgSubnet: '10.88.0.0/16',
  wgIpPrefix: '10.88.',
  wgDns: (process.env.WG_DNS || '1.1.1.1,8.8.8.8').split(',').map(s => s.trim()).filter(Boolean),
  // true = toàn bộ traffic điện thoại đi qua VPS (exit node + sing-box), như Tailscale exit node
  wgFullTunnel: process.env.WG_FULL_TUNNEL !== 'false',
  // Heartbeat của máy WireGuard đi trong tunnel tới server
  wgHeartbeatUrl: process.env.WG_HEARTBEAT_URL || 'http://10.88.0.1:9000/api/heartbeat',

  // Screenshots directory
  screenshotsDir: process.env.SCREENSHOTS_DIR || './server/data/screenshots',

  // OpenCV template matching
  templatesDir: process.env.TEMPLATES_DIR || './server/data/templates',
  opencvMatchTimeout: parseInt(process.env.OPENCV_MATCH_TIMEOUT || '10000'),
};
