import os from 'os';
import { config } from '../config/index.js';

// Predefined mock cluster nodes to simulate ALB round-robin load distribution locally
const mockClusterNodes = [
  {
    instanceId: 'i-0123456789',
    hostname: 'ip-192-168-0-135',
    availabilityZone: 'ap-south-1a',
    privateIp: '192.168.0.135'
  },
  {
    instanceId: 'i-0987654321',
    hostname: 'ip-192-168-0-205',
    availabilityZone: 'ap-south-1b',
    privateIp: '192.168.0.205'
  },
  {
    instanceId: 'i-0456789123',
    hostname: 'ip-192-168-0-148',
    availabilityZone: 'ap-south-1a',
    privateIp: '192.168.0.148'
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
      privateIp: process.env.PRIVATE_IP || '192.168.0.135'
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
