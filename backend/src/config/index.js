import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  adminPort: process.env.ADMIN_PORT ? parseInt(process.env.ADMIN_PORT, 10) : null,
  nodeEnv: process.env.NODE_ENV || 'development',
  version: '1.0.0',
  defaultRegion: process.env.AWS_REGION || 'ap-southeast-2',
  defaultAz: process.env.AWS_AZ || 'ap-southeast-2a',
  instanceId: process.env.INSTANCE_ID || 'i-0123456789',
  hostname: process.env.HOSTNAME || 'ip-192-168-0-135'
};
