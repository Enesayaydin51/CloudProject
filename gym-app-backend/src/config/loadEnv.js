const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '..', '.env');

if (process.env.SKIP_DOTENV !== '1') {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath, override: false });
  } else {
    require('dotenv').config({ override: false });
  }
}

module.exports = envPath;
