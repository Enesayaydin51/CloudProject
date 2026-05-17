# Backend IP Adresi Ayarlama Kılavuzu

Uygulamayı hem emülatörde hem de gerçek cihazda (Expo Go) çalıştırmak için backend IP adresini ayarlamanız gerekebilir.

## Otomatik Algılama

Uygulama şu sırayla IP adresini otomatik olarak algılamaya çalışır:

1. **AsyncStorage'dan kaydedilmiş IP** (varsa)
2. **Expo Go debuggerHost** (Expo Go kullanıyorsanız otomatik)
3. **Platform varsayılanları:**
   - Android Emülatör: `10.0.2.2:3000`
   - iOS Emülatör: `localhost:3000`
   - Web: `localhost:3000`

## Manuel IP Ayarlama

Eğer otomatik algılama çalışmazsa, IP adresini manuel olarak ayarlayabilirsiniz:

### 1. Bilgisayarınızın IP Adresini Öğrenin

**Windows:**
```bash
ipconfig
```
"IPv4 Address" değerini not edin (örn: `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
```
veya
```bash
ip addr show
```

### 2. Backend Sunucusunu Başlatın

Backend sunucunuzun **3000 portunda** çalıştığından emin olun:
```bash
cd gym-app-backend
npm start
```

### 3. IP Adresini Uygulamaya Kaydedin

Uygulama kodunda veya React Native Debugger'da şu komutu çalıştırın:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// IP adresinizi buraya yazın
await AsyncStorage.setItem('backendIP', '192.168.1.100');
```

Veya API servisini kullanarak:

```javascript
import api from './src/services/api';

await api.setBackendIP('192.168.1.100');
```

### 4. Uygulamayı Yeniden Başlatın

IP adresini değiştirdikten sonra uygulamayı tamamen kapatıp yeniden açın.

## Sorun Giderme

### "Network Error" Alıyorsanız

1. **Backend çalışıyor mu?**
   - `http://localhost:3000` adresine tarayıcıdan erişmeyi deneyin
   - Backend loglarını kontrol edin

2. **Firewall ayarları:**
   - Windows Firewall veya güvenlik duvarınızın 3000 portunu engellemediğinden emin olun
   - Backend sunucusuna erişim izni verin

3. **Aynı WiFi ağında mısınız?**
   - Telefon ve bilgisayar aynı WiFi ağında olmalı
   - Mobil veri kullanıyorsanız çalışmaz

4. **IP adresi doğru mu?**
   - `ipconfig` veya `ifconfig` ile tekrar kontrol edin
   - IP adresi değişmiş olabilir (DHCP)

### Expo Go ile Çalışmıyorsa

Expo Go genellikle otomatik olarak IP'yi algılar. Eğer algılamazsa:

1. Expo Go'yu kapatın
2. `expo start` komutunu çalıştırın
3. QR kodu tekrar tarayın
4. Terminal'de görünen IP adresini kontrol edin

## Test Etme

IP adresinin doğru ayarlandığını test etmek için:

```javascript
import api from './src/services/api';

// Mevcut IP'yi kontrol et
const currentIP = await api.getBackendIP();
console.log('Mevcut Backend IP:', currentIP);

// Test isteği gönder
try {
  const response = await api.login({ email: 'test@test.com', password: 'test' });
  console.log('✅ Backend bağlantısı başarılı!');
} catch (error) {
  console.error('❌ Backend bağlantısı başarısız:', error.message);
}
```

## Notlar

- IP adresi AsyncStorage'da saklanır, uygulamayı kapatıp açsanız bile kalır
- IP adresini temizlemek için: `await AsyncStorage.removeItem('backendIP')`
- Emülatör kullanıyorsanız genellikle manuel ayarlamaya gerek yoktur

