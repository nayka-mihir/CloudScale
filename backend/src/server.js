import app from './app.js';
import { config } from './config/index.js';

const PORT = config.port;
const ADMIN_PORT = config.adminPort;


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


// 2. Secondary Admin / Telemetry Listener (Port 8080 in Docker)
if (ADMIN_PORT && ADMIN_PORT !== PORT) {
  app.listen(ADMIN_PORT, '0.0.0.0', () => {
    console.log(`- Admin Cockpit:    http://0.0.0.0:${ADMIN_PORT}`);
    console.log(`========================================`);
  });
}
