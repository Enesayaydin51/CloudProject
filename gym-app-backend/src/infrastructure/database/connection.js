const { Pool } = require('pg');
const config = require('../../config/env');
const logger = require('../logging/logger');

class DatabaseConnection {
  constructor() {
    this.pool = null;
  }

  async connect() {
    if (this.pool) {
      return this.pool;
    }

    this.pool = new Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected error on idle database client');
    });

    await this.pool.query('SELECT 1');
    logger.info({ host: config.db.host, database: config.db.name }, 'Database pool ready');
    return this.pool;
  }

  getPool() {
    return this.pool;
  }

  async query(text, params) {
    if (!this.pool) {
      await this.connect();
    }

    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug({ duration, rows: res.rowCount }, 'Database query');
      return res;
    } catch (error) {
      logger.error({ err: error, duration: Date.now() - start }, 'Database query failed');
      throw error;
    }
  }

  async getClient() {
    if (!this.pool) {
      await this.connect();
    }
    return this.pool.connect();
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('Database pool closed');
    }
  }
}

module.exports = new DatabaseConnection();
