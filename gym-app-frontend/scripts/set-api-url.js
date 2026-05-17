/**
 * Bilgisayarın yerel ağ IP adresini bulup .env dosyasına EXPO_PUBLIC_API_URL yazar.
 * "npm start" çalıştırıldığında otomatik çalışır; mobil cihazdan backend'e bağlanmak için kullanılır.
 */
const os = require('os');
const path = require('path');
const fs = require('fs');

const ENV_PATH = path.join(__dirname, '..', '.env');
const API_PORT = process.env.API_PORT || '3000';

function getLocalIP() {
  const nets = os.networkInterfaces();
  /** @type {{ name: string; address: string }[]} */
  const candidates = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        candidates.push({ name, address: net.address });
      }
    }
  }

  if (candidates.length === 0) return null;

  console.log('🔍 Bulunan ağ arayüzleri:', candidates);

  // Öncelikle tipik yerel ağ IP'lerini (192.168.x.x) tercih et
  const preferredPrivate = candidates.find((c) =>
    c.address.startsWith('192.168.')
  );
  if (preferredPrivate) {
    console.log('✅ Tercih edilen IP (192.168.x.x):', preferredPrivate);
    return preferredPrivate.address;
  }

  // Son çare: ilk bulunan IPv4 adresini kullan
  console.log('ℹ️  Özel 192.168.x.x IP bulunamadı, ilk aday kullanılıyor:', candidates[0]);
  return candidates[0].address;
}

function updateEnv(ip) {
  const apiUrl = `http://${ip}:${API_PORT}/api`;
  let content = '';
  let found = false;

  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, 'utf8');
    const lines = content.split('\n');
    const newLines = lines.map((line) => {
      if (line.startsWith('EXPO_PUBLIC_API_URL=')) {
        found = true;
        return `EXPO_PUBLIC_API_URL=${apiUrl}`;
      }
      return line;
    });
    if (!found) {
      newLines.push('');
      newLines.push(`# Otomatik ayarlandı (scripts/set-api-url.js)`);
      newLines.push(`EXPO_PUBLIC_API_URL=${apiUrl}`);
    }
    content = newLines.join('\n');
  } else {
    content = `# Otomatik ayarlandı (scripts/set-api-url.js)\nEXPO_PUBLIC_API_URL=${apiUrl}\n`;
  }

  fs.writeFileSync(ENV_PATH, content, 'utf8');
  console.log('📱 API URL .env\'e yazıldı:', apiUrl);
  return apiUrl;
}

const ip = getLocalIP();
if (ip) {
  updateEnv(ip);
} else {
  console.warn('⚠️  Yerel IP bulunamadı. Mobil için .env\'de EXPO_PUBLIC_API_URL\'i elle ayarlayın.');
}
