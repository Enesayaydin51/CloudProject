const cluster = require('cluster');
const config = require('./config/env');
const logger = require('./infrastructure/logging/logger');
const { createApp } = require('./app');
const dbConnection = require('./infrastructure/database/connection');
const redisClient = require('./infrastructure/cache/redisClient');

let server = null;
let isShuttingDown = false;

async function connectBackingServices() {
  logger.info('Connecting to database');
  await dbConnection.connect();

  if (config.redis.enabled) {
    try {
      await redisClient.connect();
      logger.info('Redis connected');
    } catch (redisError) {
      logger.warn({ err: redisError }, 'Redis unavailable, continuing without cache');
    }
  }
}

async function startWorker() {
  await connectBackingServices();

  const app = createApp();
  server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(
      {
        port: config.port,
        env: config.nodeEnv,
        pid: process.pid,
      },
      'Server listening'
    );
  });

  server.on('error', (err) => {
    logger.fatal({ err }, 'Server failed to start');
    process.exit(1);
  });
}

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, 'Graceful shutdown started');

  const forceExitTimer = setTimeout(() => {
    logger.error('Shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, config.shutdownTimeoutMs);
  forceExitTimer.unref();

  const closeServer = () =>
    new Promise((resolve) => {
      if (!server) return resolve();
      server.close((err) => {
        if (err) logger.warn({ err }, 'HTTP server close error');
        resolve();
      });
    });

  try {
    await closeServer();
    await redisClient.disconnect();
    await dbConnection.close();
    logger.info('Graceful shutdown complete');
    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Shutdown error');
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
}

function registerSignalHandlers() {
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

function startWithCluster() {
  const workers = Math.max(1, config.webConcurrency);

  if (workers > 1 && cluster.isPrimary) {
    logger.info({ workers }, 'Starting cluster primary');
    registerSignalHandlers();

    for (let i = 0; i < workers; i += 1) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      if (isShuttingDown) return;
      logger.warn({ pid: worker.process.pid, code, signal }, 'Worker exited, restarting');
      cluster.fork();
    });
    return;
  }

  registerSignalHandlers();
  startWorker().catch((err) => {
    logger.fatal({ err }, 'Worker failed to start');
    process.exit(1);
  });
}

if (require.main === module) {
  startWithCluster();
}

module.exports = { startWorker, shutdown };
