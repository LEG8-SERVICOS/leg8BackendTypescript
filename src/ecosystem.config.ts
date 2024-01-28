module.exports = {
  apps: [{
    name: 'API - LEG8 ',
    script: 'main.js',
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    node_args: '--inspect=0.0.0.0',
    autorestart: true,
    exec_mode: 'cluster',
    watch: ['**/*.js', '**/*.json'],
    max_memory_restart: '512M',
  }]
};
