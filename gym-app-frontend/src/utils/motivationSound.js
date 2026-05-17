import * as ExpoAudio from 'expo-audio';

const { setAudioModeAsync } = ExpoAudio;
const createPlayer = ExpoAudio.createAudioPlayer ?? ExpoAudio.Audio?.createAudioPlayer;

let motivationPlayer = null;
const MOTIVATION_SOURCE = require('../../assets/audio/motivation.mp3');

const ONE_HOUR_SEC = 60 * 60;
const MIN_PLAYABLE_SEC = 2 * 60;

/**
 * Yüklendikten sonra rastgele saniyeye atla ve çal.
 */
async function playFromRandomPosition() {
  if (!motivationPlayer) return;
  await setAudioModeAsync({ playsInSilentMode: true });
  motivationPlayer.loop = true;
  // Kısa süre bekle ki süre bilgisi yüklensin (local asset genelde hızlı)
  await new Promise((r) => setTimeout(r, 400));
  const durationSec = motivationPlayer.duration ?? ONE_HOUR_SEC;
  const maxStartSec = Math.max(0, durationSec - MIN_PLAYABLE_SEC);
  const randomSec = maxStartSec > 0 ? Math.random() * maxStartSec : 0;
  await motivationPlayer.seekTo(randomSec);
  motivationPlayer.play();
}

/**
 * AI plan oluşturulurken arkada çalacak motivasyon müziğini başlatır.
 * Her seferinde parçanın rastgele bir yerinden çalmaya başlar.
 */
export async function playMotivationSound() {
  try {
    if (motivationPlayer) {
      await playFromRandomPosition();
      return;
    }
    motivationPlayer = createPlayer(MOTIVATION_SOURCE);
    await playFromRandomPosition();
  } catch (e) {
    // Ağ veya ses hatası olursa sessizce geç
  }
}

/**
 * Motivasyon müziğini durdurur ve serbest bırakır.
 */
export async function stopMotivationSound() {
  try {
    if (motivationPlayer) {
      motivationPlayer.pause();
      motivationPlayer.remove();
      motivationPlayer = null;
    }
  } catch (e) {
    motivationPlayer = null;
  }
}
