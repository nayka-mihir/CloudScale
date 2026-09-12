import { 
  getClusterMetrics, 
  adjustCapacity, 
  startStressTest, 
  stopStressTest,
  incrementRequestCount 
} from '../services/scalingService.js';

export const getMetrics = (req, res) => {
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

export const startLoadTest = (req, res) => {
  const result = startStressTest();
  res.status(200).json(result);
};

export const stopLoadTest = (req, res) => {
  const result = stopStressTest();
  res.status(200).json(result);
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
