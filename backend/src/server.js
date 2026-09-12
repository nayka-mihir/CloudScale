import app from './app.js';
import { config } from './config/index.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`CloudScale API Server v${config.version}`);
  console.log(`Running in ${config.nodeEnv} on port ${PORT}`);
  console.log(`- Health Check:  http://localhost:${PORT}/api/health`);
  console.log(`- App Info:      http://localhost:${PORT}/api/info`);
  console.log(`- Server Info:   http://localhost:${PORT}/api/server-info`);
  console.log(`- Metrics:       http://localhost:${PORT}/api/metrics`);
  console.log(`========================================`);
});
