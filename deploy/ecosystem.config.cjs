module.exports = {
  apps: [{
    name: 'phoneclaw-dashboard',
    script: 'node',
    args: ['--import', 'tsx', 'server/index.ts'],
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
