import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "water_v1";

function getKey(userId) {
  // userId yoksa fallback: tek kullanıcı gibi davran
  return `${KEY_PREFIX}_${userId ?? "anon"}`;
}

/** Yerel saat diliminde YYYY-MM-DD (UTC kayması olmaz) */
function formatLocalDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const getTodayKey = () => formatLocalDateKey(new Date());

const defaultState = () => ({
  goalMl: 2500,
  history: {}, // { "2026-02-26": 1200, ... }
});

async function readAll(userId) {
  const raw = await AsyncStorage.getItem(getKey(userId));
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    return {
      goalMl: typeof parsed.goalMl === "number" ? parsed.goalMl : 2500,
      history: parsed.history && typeof parsed.history === "object" ? parsed.history : {},
    };
  } catch {
    return defaultState();
  }
}

async function writeAll(state, userId) {
  await AsyncStorage.setItem(getKey(userId), JSON.stringify(state));
}

/** ✅ Goal */
export async function getGoalMl(userId) {
  const data = await readAll(userId);
  return data.goalMl || 2500;
}

export async function setGoalMl(ml, userId) {
  const data = await readAll(userId);
  const nextGoal = Math.max(250, Number(ml) || 2500);
  const next = { ...data, goalMl: nextGoal };
  await writeAll(next, userId);
  return nextGoal;
}

/** ✅ Today ml */
export async function getTodayMl(userId) {
  const data = await readAll(userId);
  const key = getTodayKey();
  return Number(data.history[key] || 0);
}

export async function addWaterMl(ml, userId) {
  const data = await readAll(userId);
  const key = getTodayKey();
  const current = Number(data.history[key] || 0);
  const nextVal = Math.max(0, current + Number(ml || 0));
  const next = {
    ...data,
    history: { ...data.history, [key]: nextVal },
  };
  await writeAll(next, userId);
  return nextVal;
}

export async function resetToday(userId) {
  const data = await readAll(userId);
  const key = getTodayKey();
  const next = {
    ...data,
    history: { ...data.history, [key]: 0 },
  };
  await writeAll(next, userId);
  return 0;
}

/** ✅ Week status (last 7 days) */
export async function getWeekStatus(userId) {
  const data = await readAll(userId);
  const goal = data.goalMl || 2500;

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = formatLocalDateKey(d);
    const ml = Number(data.history[key] || 0);
    days.push({
      date: key,
      ml,
      done: goal > 0 ? ml >= goal : false,
    });
  }
  return { goalMl: goal, days };
}

/** ✅ Streak: consecutive days (including today) reached goal */
export async function getStreak(userId) {
  const data = await readAll(userId);
  const goal = data.goalMl || 2500;
  if (goal <= 0) return 0;

  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = formatLocalDateKey(d);
    const ml = Number(data.history[key] || 0);
    if (ml >= goal) streak++;
    else break;
  }
  return streak;
}