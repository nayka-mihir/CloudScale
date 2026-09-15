import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  adminPort: process.env.ADMIN_PORT ? parseInt(process.env.ADMIN_PORT, 10) : null,
  nodeEnv: process.env.NODE_ENV || 'development',
  version: '1.0.0',
  defaultRegion: process.env.AWS_REGION || 'ap-south-1',
  defaultAz: process.env.AWS_AZ || 'ap-south-1a',
  instanceId: process.env.INSTANCE_ID || 'i-0123456789',
  hostname: process.env.HOSTNAME || 'ip-10-0-1-25'
};
