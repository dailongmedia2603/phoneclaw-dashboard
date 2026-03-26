export const config = {
  port: parseInt(process.env.SERVER_PORT || '9000'),
  host: process.env.SERVER_HOST || '0.0.0.0',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],

  // VNC proxy ports start from this number, one per device
  vncProxyPortStart: parseInt(process.env.VNC_PROXY_PORT_START || '6081'),

  // Device health check interval (ms)
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '15000'),

  // Device HTTP API timeout (ms)
  deviceApiTimeout: parseInt(process.env.DEVICE_API_TIMEOUT || '5000'),

  // Screenshots directory
  screenshotsDir: process.env.SCREENSHOTS_DIR || './server/data/screenshots',
};
