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

const router = Router();

// Core Phase 1 Endpoints
router.get('/health', getHealth);
router.get('/info', getInfo);
router.get('/server-info', getServerInfo);

// Operational & Telemetry Endpoints
router.get('/ping', ping);
router.get('/metrics', getMetrics);
router.post('/capacity', updateCapacity);
router.post('/load-test/start', startLoadTest);
router.post('/load-test/stop', stopLoadTest);
router.post('/contact', handleContact);

export default router;
