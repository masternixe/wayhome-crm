module.exports = {
  apps: [
    {
      name: 'wayhome-api',
      script: 'npx',
      args: 'tsx src/server.ts',
      cwd: './apps/api',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'wayhome-web',
      script: 'npm',
      args: 'start',
      cwd: './apps/web',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
};
