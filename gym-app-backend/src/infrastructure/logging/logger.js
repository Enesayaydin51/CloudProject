const pino = require('pino');
const config = require('../../config/env');

const logger = pino({
  level: config.logLevel,
  base: {
    service: 'gym-app-backend',
    env: config.nodeEnv,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

module.exports = logger;
