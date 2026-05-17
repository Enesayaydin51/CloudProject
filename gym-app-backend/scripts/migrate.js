#!/usr/bin/env node
/**
 * 12-Factor Admin process (XII): one-off migration runner.
 * Uses the same codebase and env config as the web process.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('../src/config/loadEnv');
const config = require('../src/config/env');
const logger = require('../src/infrastructure/logging/logger');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'gym-app-database');

async function ensureMigrationsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => /^\d{2}_.*\.sql$/i.test(name))
    .sort();
}

async function isApplied(pool, filename) {
  const result = await pool.query(
    'SELECT 1 FROM schema_migrations WHERE filename = $1',
    [filename]
  );
  return result.rowCount > 0;
}

async function applyMigration(pool, filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename]
    );
    await client.query('COMMIT');
    logger.info({ filename }, 'Migration applied');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function run() {
  const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.password,
  });

  try {
    await ensureMigrationsTable(pool);
    const files = listMigrationFiles();
    let applied = 0;
    let skipped = 0;

    for (const filename of files) {
      if (await isApplied(pool, filename)) {
        skipped += 1;
        continue;
      }
      await applyMigration(pool, filename);
      applied += 1;
    }

    logger.info({ applied, skipped, total: files.length }, 'Migrations finished');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Migration failed');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
