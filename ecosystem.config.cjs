module.exports = {
  apps: [
    {
      name: 'bicho-de-pelo-backend',
      script: 'npm',
      args: 'run start',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
