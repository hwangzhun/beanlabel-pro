const path = require('path');

module.exports = {
  apps: [
    {
      name: 'beanlabel-pro',
      script: path.join(__dirname, 'server.js'),
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        // 和 server.js 中默认端口保持一致，如需修改可以在这里改
        PORT: 2001,
      },
      error_file: path.join(__dirname, 'logs', 'err.log'),
      out_file: path.join(__dirname, 'logs', 'out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      // 如果服务器有多个 CPU，可以考虑：
      // instances: 'max',
      // exec_mode: 'cluster',
    },
  ],
};


