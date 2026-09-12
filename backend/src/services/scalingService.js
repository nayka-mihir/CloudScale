// In-memory cluster state machine
const clusterState = {
  minCapacity: 2,
  desiredCapacity: 3,
  maxCapacity: 6,
  loadTestActive: false,
  stressInterval: null,
  currentCpu: 65,
  currentRequests: 250,
  instances: [
    {
      id: 'i-0123456789',
      hostname: 'ip-10-0-1-25',
      az: 'ap-south-1a',
      state: 'running',
      health: 'healthy',
      cpu: 64,
      launchTime: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'i-0987654321',
      hostname: 'ip-10-0-2-15',
      az: 'ap-south-1b',
      state: 'running',
      health: 'healthy',
      cpu: 66,
      launchTime: new Date(Date.now() - 3600000 * 4.2).toISOString()
    },
    {
      id: 'i-0456789123',
      hostname: 'ip-10-0-1-48',
      az: 'ap-south-1a',
      state: 'running',
      health: 'healthy',
      cpu: 65,
      launchTime: new Date(Date.now() - 3600000 * 1.5).toISOString()
    }
  ],
  history: []
};

// Seed past 10 minutes history
const now = Date.now();
for (let i = 10; i >= 0; i--) {
  const t = new Date(now - i * 60000);
  const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  clusterState.history.push({
    timestamp: timeStr,
    cpu: Math.floor(45 + Math.random() * 20),
    requests: Math.floor(220 + Math.random() * 40),
    healthyHosts: 3
  });
}

// Background simulation ticker
setInterval(() => {
  if (clusterState.loadTestActive) {
    clusterState.currentCpu = Math.min(96, Math.floor(80 + Math.random() * 12));
    clusterState.currentRequests = Math.floor(750 + Math.random() * 220);

    // Auto-scaling trigger
    if (clusterState.currentCpu > 70 && clusterState.instances.length < clusterState.maxCapacity) {
      const azList = ['ap-south-1a', 'ap-south-1b'];
      const nextAz = azList[clusterState.instances.length % 2];
      const octet = Math.floor(20 + Math.random() * 70);
      const hex = Math.random().toString(16).substring(2, 12);
      const newInst = {
        id: `i-${hex}`,
        hostname: `ip-10-0-1-${octet}`,
        az: nextAz,
        state: 'running',
        health: 'healthy',
        cpu: Math.floor(clusterState.currentCpu * 0.9),
        launchTime: new Date().toISOString()
      };
      clusterState.instances.push(newInst);
      clusterState.desiredCapacity = clusterState.instances.length;
    }
  } else {
    // Steady state: maintain around 50-65%
    const target = 55 + Math.floor(Math.random() * 10);
    clusterState.currentCpu = Math.max(28, Math.floor(clusterState.currentCpu * 0.85 + target * 0.15));
    clusterState.currentRequests = Math.max(200, Math.floor(clusterState.currentRequests * 0.9 + 250 * 0.1));

    // Auto-scale in
    if (clusterState.currentCpu < 30 && clusterState.instances.length > clusterState.minCapacity) {
      clusterState.instances.pop();
      clusterState.desiredCapacity = clusterState.instances.length;
    }
  }

  // Update instance level CPU
  clusterState.instances.forEach((inst, idx) => {
    inst.cpu = Math.max(15, Math.min(100, Math.floor(clusterState.currentCpu + (idx % 2 === 0 ? 2 : -2) + (Math.random() * 4 - 2))));
  });

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (clusterState.history.length > 20) clusterState.history.shift();
  clusterState.history.push({
    timestamp: timeStr,
    cpu: clusterState.currentCpu,
    requests: clusterState.currentRequests,
    healthyHosts: clusterState.instances.length
  });
}, 4000);

export function getClusterMetrics() {
  const healthyCount = clusterState.instances.filter(i => i.health === 'healthy').length;
  return {
    summary: {
      totalInstances: clusterState.instances.length,
      healthyInstances: healthyCount,
      unhealthyInstances: clusterState.instances.length - healthyCount,
      avgCpuPercent: clusterState.currentCpu,
      requestsPerMinute: clusterState.currentRequests,
      minCapacity: clusterState.minCapacity,
      desiredCapacity: clusterState.desiredCapacity,
      maxCapacity: clusterState.maxCapacity,
      loadTestActive: clusterState.loadTestActive
    },
    instances: clusterState.instances,
    history: clusterState.history
  };
}

export function adjustCapacity(action, value) {
  if (action === 'increase') {
    if (clusterState.desiredCapacity < clusterState.maxCapacity) {
      clusterState.desiredCapacity += 1;
      const az = clusterState.instances.length % 2 === 0 ? 'ap-south-1a' : 'ap-south-1b';
      const hex = Math.random().toString(16).substring(2, 12);
      const octet = Math.floor(10 + Math.random() * 80);
      clusterState.instances.push({
        id: `i-${hex}`,
        hostname: `ip-10-0-1-${octet}`,
        az,
        state: 'running',
        health: 'healthy',
        cpu: 50,
        launchTime: new Date().toISOString()
      });
      return { success: true, desiredCapacity: clusterState.desiredCapacity, message: `Capacity increased to ${clusterState.desiredCapacity}` };
    }
    throw new Error(`Cannot exceed max capacity of ${clusterState.maxCapacity}`);
  }

  if (action === 'decrease') {
    if (clusterState.desiredCapacity > clusterState.minCapacity) {
      clusterState.desiredCapacity -= 1;
      if (clusterState.instances.length > clusterState.minCapacity) {
        clusterState.instances.pop();
      }
      return { success: true, desiredCapacity: clusterState.desiredCapacity, message: `Capacity decreased to ${clusterState.desiredCapacity}` };
    }
    throw new Error(`Cannot decrease below min capacity of ${clusterState.minCapacity}`);
  }

  throw new Error('Invalid capacity adjustment action');
}

export function startStressTest() {
  if (clusterState.loadTestActive) return { success: true, message: 'Load test already active' };

  clusterState.loadTestActive = true;
  clusterState.currentCpu = 78;
  clusterState.currentRequests = 740;

  const stressWorker = () => {
    if (!clusterState.loadTestActive) return;
    const start = Date.now();
    while (Date.now() - start < 140) {
      Math.sqrt(Math.random() * 1000000);
    }
    setTimeout(stressWorker, 60);
  };
  stressWorker();

  return {
    success: true,
    message: 'High load test started: Simulated compute spike triggers CloudWatch scale-out evaluation (>70%).'
  };
}

export function stopStressTest() {
  clusterState.loadTestActive = false;
  return {
    success: true,
    message: 'Load test stopped. Cluster entering stabilization cooldown window.'
  };
}

export function incrementRequestCount(count = 1) {
  clusterState.currentRequests += count;
}
