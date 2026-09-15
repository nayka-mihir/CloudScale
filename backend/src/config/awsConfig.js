import { AutoScalingClient } from '@aws-sdk/client-auto-scaling';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { EC2Client } from '@aws-sdk/client-ec2';
import dotenv from 'dotenv';

dotenv.config();

export const awsConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
  asgName: process.env.AWS_ASG_NAME || 'cloudscale-asg',
  targetGroupArn: process.env.AWS_TARGET_GROUP_ARN || '',
  // Force simulation mode if requested via env, or automatically fallback when no AWS credentials exist
  simulateAws: process.env.SIMULATE_AWS === 'true' || (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_EXECUTION_ENV)
};

// Client configuration options
const clientOptions = {
  region: awsConfig.region,
  maxAttempts: 3
};

// If local AWS credentials are explicitly provided via env vars (for local testing only; IAM role used in EC2)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientOptions.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {})
  };
}

export const autoScalingClient = new AutoScalingClient(clientOptions);
export const cloudWatchClient = new CloudWatchClient(clientOptions);
export const ec2Client = new EC2Client(clientOptions);
