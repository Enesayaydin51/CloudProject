const { createClient } = require('redis');
const config = require('../../config/env');
const logger = require('../logging/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isEnabled = config.redis.enabled;
  }

  getUrl() {
    if (config.redis.url) {
      return config.redis.url;
    }

    const { host, port, password } = config.redis;
    if (password) {
      return `redis://:${password}@${host}:${port}`;
    }
    return `redis://${host}:${port}`;
  }

  async connect() {
    if (!this.isEnabled) {
      return;
    }

    if (this.client?.isOpen) {
      return;
    }

    this.client = createClient({
      url: this.getUrl(),
      socket: {
        connectTimeout: config.redis.connectTimeoutMs,
      },
    });

    this.client.on('error', (error) => {
      logger.warn({ err: error }, 'Redis client error');
    });

    await this.client.connect();
  }

  async disconnect() {
    if (this.client?.isOpen) {
      await this.client.quit();
      logger.info('Redis disconnected');
    }
  }

  isReady() {
    return Boolean(this.client?.isReady);
  }

  async get(key) {
    if (!this.client?.isReady) return null;
    return this.client.get(key);
  }

  async setWithTtl(key, value, ttlSeconds) {
    if (!this.client?.isReady) return;
    await this.client.set(key, value, { EX: ttlSeconds });
  }
}

module.exports = new RedisClient();
