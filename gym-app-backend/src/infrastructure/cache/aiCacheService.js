const crypto = require('crypto');
const redisClient = require('./redisClient');

class AICacheService {
  buildKey(namespace, payload) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    return `gym-app:ai:${namespace}:${hash}`;
  }

  async get(namespace, payload) {
    const key = this.buildKey(namespace, payload);
    const raw = await redisClient.get(key);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  async set(namespace, payload, data, ttlSeconds) {
    const key = this.buildKey(namespace, payload);
    const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
    await redisClient.setWithTtl(key, serializedData, ttlSeconds);
  }
}

module.exports = new AICacheService();
