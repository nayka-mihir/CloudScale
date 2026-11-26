import { Worker } from 'worker_threads';
import os from 'os';

let activeWorkers = [];
let stressTimeout = null;
let isRunning = false;

// Worker thread inline script: performs compute-heavy hashing with micro-yields to keep event loop healthy
const workerCode = `
  const { parentPort } = require('worker_threads');
  const crypto = require('crypto');
  let running = true;

  parentPort.on('message', (msg) => {
    if (msg === 'stop') {
      running = false;
    }
  });

  const buffer = Buffer.alloc(2048, 'x');

  function burnCpuCycle() {
    if (!running) return;
    const start = Date.now();
    // Burn CPU for 90ms continuously (computational load)
    while (Date.now() - start < 90) {
      crypto.createHash('sha256').update(buffer).digest();
    }
    // Yield 10ms so OS and ALB health checks remain responsive
    setTimeout(burnCpuCycle, 10);
  }

  burnCpuCycle();
`;

/**
 * Starts real physical CPU stress using worker threads across all available CPU cores.
 * @param {number} durationSeconds - Duration before automatic safety termination (default: 300s / 5 mins)
 */
export function startLocalStress(durationSeconds = 300) {
  if (isRunning) {
    return { active: true, workers: activeWorkers.length, duration: durationSeconds, message: 'Local stress already running' };
  }

  stopLocalStress();
  isRunning = true;

  const numCores = Math.max(1, os.cpus().length);
  console.log(`[CPU Stress] Launching ${numCores} worker threads for real physical hardware stress (${durationSeconds}s)...`);

  for (let i = 0; i < numCores; i++) {
    try {
      const worker = new Worker(workerCode, { eval: true });
      worker.on('error', (err) => console.warn(`[CPU Stress] Worker ${i} error: ${err.message}`));
      activeWorkers.push(worker);
    } catch (err) {
      console.warn(`[CPU Stress] Failed to spawn worker ${i}: ${err.message}`);
    }
  }

  if (durationSeconds > 0) {
    stressTimeout = setTimeout(() => {
      console.log(`[CPU Stress] Auto safety timeout (${durationSeconds}s) reached. Stopping real CPU stress.`);
      stopLocalStress();
    }, durationSeconds * 1000);
  }

  return {
    active: true,
    workers: activeWorkers.length,
    duration: durationSeconds,
    message: `Physical hardware CPU stress initiated with ${activeWorkers.length} worker threads.`
  };
}

/**
 * Stops all real physical CPU stress worker threads immediately.
 */
export function stopLocalStress() {
  if (stressTimeout) {
    clearTimeout(stressTimeout);
    stressTimeout = null;
  }

  for (const worker of activeWorkers) {
    try {
      worker.postMessage('stop');
      worker.terminate();
    } catch (e) {
      // Ignore termination errors on already exited workers
    }
  }

  const count = activeWorkers.length;
  activeWorkers = [];
  isRunning = false;

  console.log(`[CPU Stress] Terminated ${count} worker threads. CPU returning to idle.`);
  return { active: false, terminatedWorkers: count };
}

/**
 * Returns current stress state.
 */
export function isStressActive() {
  return isRunning && activeWorkers.length > 0;
}
