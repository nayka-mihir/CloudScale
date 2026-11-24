// In-memory cluster state machine
const clusterState = {
  minCapacity: 2,
  desiredCapacity: 2,
  maxCapacity: 6,
  loadTestActive: false,
  stressTimeout: null,
  lastScaleTime: 0,          // Timestamp of last scaling action (Scale-out or Scale-in)
  scaleCooldownMs: 25000,    // 25-second stabilization cooldown window (prevents flapping)
  currentCpu: 38,
  currentRequests: 160,
  instances: [
    {
      id: 'i-07fc1d8338766d3b5',
      hostname: 'ip-192-168-0-135',
      az: 'ap-southeast-2a',
      state: 'running',
      health: 'healthy',
      cpu: 38,
      launchTime: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'i-0ebf45aadfd8cc5b6',
      hostname: 'ip-192-168-0-205',
      az: 'ap-southeast-2b',
      state: 'running',
      health: 'healthy',
      cpu: 40,
      launchTime: new Date(Date.now() - 3600000 * 4.2).toISOString()
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
    cpu: Math.floor(35 + Math.random() * 8),
    requests: Math.floor(150 + Math.random() * 30),
    healthyHosts: 2
  });
}

// Background simulation ticker
setInterval(() => {
  const currentTime = Date.now();
  const timeSinceLastScale = currentTime - clusterState.lastScaleTime;

  if (clusterState.loadTestActive) {
    // Dynamic load sharing: as new instances join, load distributes
    // 2 instances: 22 + (115 / 2) = 79-82% -> Triggers scale out to 3
    // 3 instances: 22 + (115 / 3) = 60-63% -> Absorbs load, drops below 70%!
    const baseLoad = 22;
    const dynamicLoad = Math.floor(115 / clusterState.instances.length);
    clusterState.currentCpu = Math.min(95, baseLoad + dynamicLoad + Math.floor(Math.random() * 4));
    clusterState.currentRequests = Math.floor(280 * clusterState.instances.length + Math.random() * 40);

    // Auto-scaling trigger:
    // 1. Average CPU > 72%
    // 2. Cooldown period (25s) has elapsed since last scaling event
    // 3. Cluster is below max capacity
    if (clusterState.currentCpu > 72 && 
        timeSinceLastScale > clusterState.scaleCooldownMs && 
        clusterState.instances.length < clusterState.maxCapacity) {
      
      const azList = ['ap-southeast-2a', 'ap-southeast-2b'];
      const nextAz = azList[clusterState.instances.length % 2];
      const octet = Math.floor(130 + clusterState.instances.length * 18);
      const hex = Math.random().toString(16).substring(2, 12);
      const newInst = {
        id: `i-${hex}`,
        hostname: `ip-192-168-0-${octet}`,
        az: nextAz,
        state: 'running',
        health: 'healthy',
        cpu: Math.floor(clusterState.currentCpu * 0.85),
        launchTime: new Date().toISOString()
      };
      clusterState.instances.push(newInst);
      clusterState.desiredCapacity = clusterState.instances.length;
      clusterState.lastScaleTime = currentTime; // Lock scaling cooldown
    }
  } else {
    // Steady state: maintain around 34-42%
    const target = 36 + Math.floor(Math.random() * 6);
    clusterState.currentCpu = Math.max(25, Math.floor(clusterState.currentCpu * 0.8 + target * 0.2));
    clusterState.currentRequests = Math.max(120, Math.floor(clusterState.currentRequests * 0.85 + 150 * 0.15));

    // Auto-scale in: ONLY when:
    // 1. Load test is NOT active
    // 2. Cooldown period (25s) has passed
    // 3. CPU is safely below 40% (32% hysteresis safety buffer)
    // 4. Cluster is above floor capacity (respects manual capacity increases)
    const floorCapacity = clusterState.manualDesired || clusterState.minCapacity;
    if (timeSinceLastScale > clusterState.scaleCooldownMs && 
        clusterState.currentCpu < 40 && 
        clusterState.instances.length > floorCapacity) {
      
      clusterState.instances.pop();
      clusterState.desiredCapacity = clusterState.instances.length;
      clusterState.lastScaleTime = currentTime; // Lock scaling cooldown
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
}, 3500);

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
      clusterState.manualDesired = clusterState.desiredCapacity;
      clusterState.lastScaleTime = Date.now();
      const az = clusterState.instances.length % 2 === 0 ? 'ap-southeast-2a' : 'ap-southeast-2b';
      const hex = Math.random().toString(16).substring(2, 12);
      const octet = Math.floor(130 + clusterState.instances.length * 18);
      clusterState.instances.push({
        id: `i-${hex}`,
        hostname: `ip-192-168-0-${octet}`,
        az,
        state: 'running',
        health: 'healthy',
        cpu: 45,
        launchTime: new Date().toISOString()
      });
      return { success: true, desiredCapacity: clusterState.desiredCapacity, message: `Capacity increased to ${clusterState.desiredCapacity}` };
    }
    throw new Error(`Cannot exceed max capacity of ${clusterState.maxCapacity}`);
  }

  if (action === 'decrease') {
    if (clusterState.desiredCapacity > clusterState.minCapacity) {
      clusterState.desiredCapacity -= 1;
      clusterState.manualDesired = clusterState.desiredCapacity;
      clusterState.lastScaleTime = Date.now();
      if (clusterState.instances.length > clusterState.minCapacity) {
        clusterState.instances.pop();
      }
      return { success: true, desiredCapacity: clusterState.desiredCapacity, message: `Capacity decreased to ${clusterState.desiredCapacity}` };
    }
    throw new Error(`Cannot decrease below min capacity of ${clusterState.minCapacity}`);
  }

  throw new Error('Invalid capacity adjustment action');
}

export function syncRealAwsCluster(realStatus, realInstances) {
  if (realStatus) {
    if (typeof realStatus.desiredCapacity === 'number') {
      clusterState.desiredCapacity = realStatus.desiredCapacity;
    }
    if (typeof realStatus.minCapacity === 'number') {
      clusterState.minCapacity = realStatus.minCapacity;
    }
    if (typeof realStatus.maxCapacity === 'number') {
      clusterState.maxCapacity = realStatus.maxCapacity;
    }
  }
  if (Array.isArray(realInstances) && realInstances.length > 0) {
    clusterState.instances = realInstances;
  }
}

export function startStressTest() {
  if (clusterState.loadTestActive) return { success: true, message: 'Load test already active' };

  clusterState.loadTestActive = true;
  clusterState.currentCpu = 78;
  clusterState.currentRequests = 560;

  // Safety auto-stop after 90 seconds so load tests don't run indefinitely
  if (clusterState.stressTimeout) clearTimeout(clusterState.stressTimeout);
  clusterState.stressTimeout = setTimeout(() => {
    stopStressTest();
  }, 90000);

  return {
    success: true,
    message: 'High load test started: Simulated compute spike triggers CloudWatch scale-out evaluation (>70%).'
  };
}

export function stopStressTest() {
  clusterState.loadTestActive = false;
  clusterState.lastScaleTime = Date.now(); // Initialize cooldown on test stop
  if (clusterState.stressTimeout) {
    clearTimeout(clusterState.stressTimeout);
    clusterState.stressTimeout = null;
  }
  return {
    success: true,
    message: 'Load test stopped. Cluster entering 25-second stabilization cooldown window.'
  };
}

export function incrementRequestCount(count = 1) {
  clusterState.currentRequests += count;
}
