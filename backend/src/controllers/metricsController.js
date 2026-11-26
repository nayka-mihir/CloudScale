import { 
  getClusterMetrics, 
  adjustCapacity, 
  startStressTest, 
  stopStressTest,
  incrementRequestCount,
  syncRealAwsCluster
} from '../services/scalingService.js';
import * as awsService from '../services/awsService.js';
import { awsConfig } from '../config/awsConfig.js';
import { startLocalStress, stopLocalStress } from '../services/cpuStressService.js';

export const getMetrics = async (req, res) => {
  if (!awsConfig.simulateAws) {
    try {
      const realStatus = await awsService.getInfrastructureStatus();
      const realInst = await awsService.getInstanceMetrics();
      if (realStatus && realInst?.instances?.length) {
        syncRealAwsCluster(realStatus, realInst.instances);
      }
    } catch (e) {
      console.warn(`[Metrics Sync] Real AWS sync warning: ${e.message}`);
    }
  }
  const metrics = getClusterMetrics();
  res.status(200).json(metrics);
};

export const updateCapacity = (req, res) => {
  const { action, desiredCapacity } = req.body;
  try {
    const result = adjustCapacity(action, desiredCapacity);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const startLoadTest = async (req, res) => {
  const duration = req.body?.duration || 300; // 5-minute default for CloudWatch evaluation
  // 1. Start real physical CPU stress worker threads locally on this instance
  startLocalStress(duration);
  // 2. Broadcast stress start to all peer instances in the ASG
  awsService.broadcastStressToCluster('start', duration);
  // 3. Update in-memory telemetry state
  const result = startStressTest(duration);
  res.status(200).json({
    ...result,
    realStressActive: true,
    durationSeconds: duration,
    message: 'High load test started: Real physical CPU stress active (~90% CPU) across all cluster nodes. CloudWatch Target Tracking evaluating scale-out.'
  });
};

export const stopLoadTest = async (req, res) => {
  // 1. Stop real CPU stress locally
  stopLocalStress();
  // 2. Broadcast stress stop to all peer instances in the ASG
  awsService.broadcastStressToCluster('stop');
  // 3. Update in-memory telemetry state
  const result = stopStressTest();
  res.status(200).json({
    ...result,
    realStressActive: false,
    message: 'Load test stopped. Physical CPU stress terminated across all cluster nodes. ASG entering cooldown.'
  });
};

export const handleInternalStressStart = (req, res) => {
  const duration = req.body?.durationSeconds || 300;
  startLocalStress(duration);
  startStressTest(duration);
  res.status(200).json({ success: true, message: 'Internal physical stress started' });
};

export const handleInternalStressStop = (req, res) => {
  stopLocalStress();
  stopStressTest();
  res.status(200).json({ success: true, message: 'Internal physical stress stopped' });
};

export const handleContact = (req, res) => {
  const { name, email, message } = req.body;
  incrementRequestCount(5);
  res.status(200).json({
    success: true,
    message: `Thank you ${name || 'Visitor'}, your contact transmission was processed by CloudScale backend.`,
    timestamp: new Date().toISOString()
  });
};

export const ping = (req, res) => {
  incrementRequestCount(1);
  res.status(200).json({
    pong: true,
    timestamp: Date.now()
  });
};
