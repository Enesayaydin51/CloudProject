# Android’de ses gelmiyorsa

## 1. Emülatör / cihaz sesi

- **Emülatör:** Pencerede sağ taraftaki **⋯** (üç nokta) → **Settings** → **General** → **Send keyboard input to device** yanında ses ayarları olabilir. Daha önemlisi:
  - Emülatör penceresi açıkken bilgisayarın **sesini** aç (Windows ses ikonu).
  - Emülatör içinde: **Ayarlar → Ses** bölümünde **Medya** sesini artır.
- **Gerçek cihaz:** Cihazın **ses tuşlarıyla** sesi aç (özellikle medya sesi, zil sesi değil).

## 2. Uygulama ses izni (Android)

Sadece müzik çalmak için özel bir izin gerekmez. Yine de ses gelmiyorsa:

- **Ayarlar → Uygulamalar → Proje2 (uygulama adın)** → **İzinler** → “Mikrofon” veya “Depolama” kapalı olsa bile **ses çalma** çalışır; izinleri açman gerekmez.
- **Rahatsız Etmeyin / Do Not Disturb** kapalı olsun; bazen medya sesini kısar.

## 3. Android Studio’da test

1. **Run** ile uygulamayı emülatör veya cihaza yükle.
2. Uygulamada **AI plan oluştur** (Beslenme veya Egzersiz).
3. Plan oluşurken müzik çalmalı. Çalmıyorsa:
   - Emülatörde: Bilgisayar sesi açık mı, emülatör “Ses” ayarında medya sesi var mı kontrol et.
   - Gerçek cihazda: Medya sesini artır, Rahatsız Etmeyin’i kapat.

## 4. Config güncellemesi sonrası

`app.config.js` içine `expo-av` eklendi. Değişiklikten sonra native tarafı yenilemek için:

```bash
npx expo prebuild --clean
```

Sonra tekrar **Run** ile çalıştır. (Expo Go kullanıyorsan `prebuild` gerekmez; sadece ses ve ayarları kontrol et.)
