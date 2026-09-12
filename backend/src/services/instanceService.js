import os from 'os';
import { config } from '../config/index.js';

// Predefined mock cluster nodes to simulate ALB round-robin load distribution locally
const mockClusterNodes = [
  {
    instanceId: 'i-0123456789',
    hostname: 'ip-10-0-1-25',
    availabilityZone: 'ap-south-1a',
    privateIp: '10.0.1.25'
  },
  {
    instanceId: 'i-0987654321',
    hostname: 'ip-10-0-2-15',
    availabilityZone: 'ap-south-1b',
    privateIp: '10.0.2.15'
  },
  {
    instanceId: 'i-0456789123',
    hostname: 'ip-10-0-1-48',
    availabilityZone: 'ap-south-1a',
    privateIp: '10.0.1.48'
  }
];

let roundRobinIndex = 0;

export async function getServerInfo(req) {
  // If running on actual EC2, environment variables or IMDSv2 can provide values
  if (process.env.AWS_EXECUTION_ENV || process.env.INSTANCE_ID) {
    return {
      instanceId: process.env.INSTANCE_ID || config.instanceId,
      hostname: os.hostname() || config.hostname,
      availabilityZone: process.env.AWS_AZ || config.defaultAz,
      privateIp: process.env.PRIVATE_IP || '10.0.1.25'
    };
  }

  // In local development / demo mode, simulate ALB distribution across nodes
  const node = mockClusterNodes[roundRobinIndex % mockClusterNodes.length];
  roundRobinIndex++;
  return {
    ...node,
    localHost: os.hostname(),
    loadBalancedVia: 'AWS ALB Target Group'
  };
}

export function getHealthInfo() {
  const currentHost = process.env.HOSTNAME || os.hostname() || config.hostname;
  return {
    status: 'healthy',
    hostname: currentHost,
    version: config.version,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  };
}

export function getGeneralInfo() {
  const currentHost = process.env.HOSTNAME || os.hostname() || config.hostname;
  return {
    status: 'healthy',
    hostname: currentHost,
    version: config.version,
    environment: config.nodeEnv,
    region: config.defaultRegion
  };
}
