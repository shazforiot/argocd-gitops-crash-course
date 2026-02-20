const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint (used by Kubernetes probes)
app.get('/health', (_, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Main endpoint — shows deployment info
app.get('/', (_, res) => {
  res.json({
    message: '🚀 GitOps Demo App — Deployed with ArgoCD!',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    hostname: os.hostname(),          // Shows which pod is serving
    timestamp: new Date().toISOString(),
    gitops: {
      tool: 'ArgoCD',
      pattern: 'Pull-based GitOps',
      repo: 'https://github.com/your-org/gitops-demo-config'
    }
  });
});

// Ready check (separate from health — ensures dependencies are up)
app.get('/ready', (_, res) => {
  res.json({ ready: true });
});

app.listen(PORT, () => {
  console.log(`✅ GitOps Demo App running on port ${PORT}`);
  console.log(`   Version : ${process.env.APP_VERSION || '1.0.0'}`);
  console.log(`   Env     : ${process.env.NODE_ENV || 'development'}`);
});
