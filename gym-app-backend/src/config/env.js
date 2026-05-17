require('./loadEnv');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

function requireEnv(name, devDefault) {
  const value = process.env[name];
  if (value !== undefined && value !== '') {
    return value;
  }
  if (isProduction) {
    throw new Error(`[config] Production requires env: ${name}`);
  }
  if (devDefault !== undefined) {
    return devDefault;
  }
  throw new Error(`[config] Missing env: ${name}`);
}

function optionalInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`[config] Invalid integer for ${name}: ${raw}`);
  }
  return parsed;
}

const defaultDevCorsOrigins = [
  'http://localhost:3000',
  'http://localhost:8081',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8081',
  'http://10.0.2.2:8081',
  'http://10.0.2.2:3000',
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  /^http:\/\/10\.0\.2\.\d+:\d+$/,
];

function resolveCorsOrigins() {
  const raw = process.env.CORS_ORIGINS;
  if (raw && raw.trim()) {
    return raw.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  if (isProduction) {
    const apiOrigin = (process.env.PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
    return [apiOrigin];
  }
  return defaultDevCorsOrigins;
}

const config = {
  nodeEnv,
  isProduction,
  isTest,
  port: optionalInt('PORT', 3000),
  publicApiUrl: process.env.PUBLIC_API_URL || `http://localhost:${optionalInt('PORT', 3000)}`,
  logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  webConcurrency: optionalInt('WEB_CONCURRENCY', 1),
  shutdownTimeoutMs: optionalInt('SHUTDOWN_TIMEOUT_MS', 10000),
  cors: {
    origins: resolveCorsOrigins(),
  },
  db: {
    host: requireEnv('DB_HOST', 'localhost'),
    port: optionalInt('DB_PORT', 5432),
    name: requireEnv('DB_NAME', 'gym_app_db'),
    user: requireEnv('DB_USER', 'postgres'),
    password: requireEnv('DB_PASSWORD', 'postgres'),
  },
  jwt: {
    secret: requireEnv('JWT_SECRET', 'dev-only-change-me-not-for-production'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  redis: {
    enabled: process.env.REDIS_ENABLED !== 'false',
    url: process.env.REDIS_URL || null,
    host: process.env.REDIS_HOST || 'localhost',
    port: optionalInt('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD || null,
    connectTimeoutMs: optionalInt('REDIS_CONNECT_TIMEOUT_MS', 5000),
    ttl: {
      answerNutritionQuestion: optionalInt('REDIS_TTL_ANSWER_SECONDS', 1800),
      generateNutritionPlan: optionalInt('REDIS_TTL_NUTRITION_PLAN_SECONDS', 3600),
      suggestFoods: optionalInt('REDIS_TTL_SUGGEST_FOODS_SECONDS', 1800),
      generateExerciseProgram: optionalInt('REDIS_TTL_EXERCISE_PROGRAM_SECONDS', 3600),
    },
  },
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};

process.env.NODE_ENV = config.nodeEnv;
process.env.PORT = String(config.port);
process.env.JWT_SECRET = config.jwt.secret;
process.env.JWT_EXPIRES_IN = config.jwt.expiresIn;
process.env.DB_HOST = config.db.host;
process.env.DB_PORT = String(config.db.port);
process.env.DB_NAME = config.db.name;
process.env.DB_USER = config.db.user;
process.env.DB_PASSWORD = config.db.password;
process.env.REDIS_ENABLED = config.redis.enabled ? 'true' : 'false';
process.env.REDIS_HOST = config.redis.host;
process.env.REDIS_PORT = String(config.redis.port);
if (config.redis.url) process.env.REDIS_URL = config.redis.url;
if (config.geminiApiKey) process.env.GEMINI_API_KEY = config.geminiApiKey;

module.exports = config;
