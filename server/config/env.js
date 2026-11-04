import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 5050,
  mongoUri: process.env.MONGODB_URI || '',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  nodeEnv: process.env.NODE_ENV || 'development',
  // On startup, create the default demo accounts if they are missing (set AUTO_SEED=false to skip).
  autoSeed: process.env.AUTO_SEED !== 'false',
};

export const isProduction = env.nodeEnv === 'production';
export const isTest = env.nodeEnv === 'test';
