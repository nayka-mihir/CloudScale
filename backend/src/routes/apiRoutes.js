import { Router } from 'express';
import { getHealth, getInfo, getServerInfo } from '../controllers/healthController.js';
import { 
  getMetrics, 
  updateCapacity, 
  startLoadTest, 
  stopLoadTest, 
  handleContact, 
  ping 
} from '../controllers/metricsController.js';
import {
  getInfrastructureStatus,
  scaleIncrease,
  scaleDecrease,
  getCpuMetrics,
  getRequestMetrics,
  getInstancesMetrics
} from '../controllers/infrastructureController.js';

import {
  loginAdmin,
  verifyAdminSession,
  logoutAdmin
} from '../controllers/authController.js';

const router = Router();

// --- Authentication Endpoints ---
router.post('/auth/login', loginAdmin);
router.get('/auth/verify', verifyAdminSession);
router.post('/auth/logout', logoutAdmin);

// --- Phase 1 Baseline Endpoints ---
router.get('/health', getHealth);
router.get('/info', getInfo);
router.get('/server-info', getServerInfo);
router.get('/ping', ping);
router.post('/contact', handleContact);

// --- Phase 2: AWS Infrastructure Control & Telemetry Endpoints ---
// Infrastructure Status
router.get('/infrastructure/status', getInfrastructureStatus);

// Auto-Scaling Controls
router.post('/scaling/increase', scaleIncrease);
router.post('/scaling/decrease', scaleDecrease);

// Dedicated Telemetry Metrics
router.get('/metrics/cpu', getCpuMetrics);
router.get('/metrics/requests', getRequestMetrics);
router.get('/metrics/instances', getInstancesMetrics);

// Full Telemetry & Stress Test Suite
router.get('/metrics', getMetrics);
router.post('/capacity', updateCapacity);
router.post('/load-test/start', startLoadTest);
router.post('/load-test/stop', stopLoadTest);

export default router;
