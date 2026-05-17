const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { spawnSync } = require('child_process');

const backendRoot = path.join(__dirname, '..');

test('development config loads with defaults', () => {
  process.env.NODE_ENV = 'development';
  process.env.JWT_SECRET = 'test-secret';
  const envPath = path.join(backendRoot, 'src', 'config', 'env.js');
  delete require.cache[envPath];
  delete require.cache[path.join(backendRoot, 'src', 'config', 'loadEnv.js')];
  const config = require('../src/config/env');
  assert.strictEqual(config.nodeEnv, 'development');
  assert.ok(config.jwt.secret);
});

test('production rejects missing JWT_SECRET', () => {
  const result = spawnSync(
    process.execPath,
    ["-e", "require('./src/config/env')"],
    {
      cwd: backendRoot,
      env: {
        SKIP_DOTENV: '1',
        NODE_ENV: 'production',
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'gym_app_db',
        DB_USER: 'postgres',
        DB_PASSWORD: 'postgres',
        PORT: '3000',
      },
      encoding: 'utf8',
    }
  );
  assert.notStrictEqual(result.status, 0);
  assert.match(result.stderr || result.stdout, /JWT_SECRET/);
});
