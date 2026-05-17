import { Alert } from "react-native";

const STAGGER_MS = 480;

/**
 * Yeni kazanılan rozetler için sırayla tebrik Alert'i (API `newlyUnlocked` dizisi).
 * @param {Array<{ code?: string, title?: string, description?: string }>} items
 */
/**
 * API yanıtında `newlyUnlocked` varsa Alert gösterir.
 * GET /auth/achievements: { success, data: { newlyUnlocked } }
 * Kayıt uçları: { success, data: { ..., newlyUnlocked } } veya auth: { success, data, newlyUnlocked }
 */
export function showNotificationsIfNewlyUnlocked(res) {
  const list = res?.data?.newlyUnlocked ?? res?.newlyUnlocked;
  if (res?.success && Array.isArray(list) && list.length > 0) {
    showNewAchievementAlerts(list);
  }
}

export function showNewAchievementAlerts(items) {
  if (!Array.isArray(items) || items.length === 0) return;

  items.forEach((item, index) => {
    const title = item?.title || item?.code || "Rozet";
    const extra = item?.description ? `\n\n${item.description}` : "";
    setTimeout(() => {
      Alert.alert(
        "Tebrikler!",
        `“${title}” rozetini kazandın.${extra}`,
        [{ text: "Harika!" }],
        { cancelable: true }
      );
    }, index * STAGGER_MS);
  });
}

/**
 * GET /auth/achievements sonrası yeni rozet varsa bildirim gösterir.
 */
export async function fetchAchievementsAndShowNotifications(apiService) {
  try {
    const res = await apiService.getAchievements();
    showNotificationsIfNewlyUnlocked(res);
    return res;
  } catch {
    return null;
  }
}
