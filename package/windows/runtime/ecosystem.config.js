const path = require('path');

const BLEND_RUNTIME_DIR = process.env.BLEND_RUNTIME_DIR || path.resolve(__dirname);

module.exports = {
  apps: [{
    name: 'Blend',
    script: 'blend.exe',
    cwd: BLEND_RUNTIME_DIR,
    instances: 1,
    exec_mode: 'fork_mode',
    exec_interpreter: 'none',
    env: {
      NODE_ENV: 'production',
    },
    autorestart: true,
    kill_timeout: 3000,
    restart_delay: 5000,
  }],
};
