import * as ExpoAudio from 'expo-audio';

const { setAudioModeAsync } = ExpoAudio;
const createPlayer = ExpoAudio.createAudioPlayer ?? ExpoAudio.Audio?.createAudioPlayer;

let clickPlayer = null;
const CLICK_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568-press.mp3';

/**
 * Tuş tıklama sesi çalar.
 */
export async function playClickSound() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
    });
    if (!clickPlayer) {
      clickPlayer = createPlayer(CLICK_SOUND_URL);
    }
    await clickPlayer.seekTo(0);
    clickPlayer.play();
  } catch (e) {
    // Ses yüklenemezse veya çalınamazsa sessizce geç
  }
}
