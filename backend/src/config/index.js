import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  version: '1.0.0',
  defaultRegion: process.env.AWS_REGION || 'ap-south-1',
  defaultAz: process.env.AWS_AZ || 'ap-south-1a',
  instanceId: process.env.INSTANCE_ID || 'i-0123456789',
  hostname: process.env.HOSTNAME || 'ip-10-0-1-25'
};
