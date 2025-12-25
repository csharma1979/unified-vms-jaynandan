module.exports = {
  apps: [
    {
      name: 'vms-backend',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'vms-frontend',
      cwd: './frontend',
      script: 'node_modules/.bin/serve',
      args: '-s dist -l 30000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        REACT_APP_BACKEND_URL: 'http://209.145.53.86:4000'
      }
    }
  ]
};