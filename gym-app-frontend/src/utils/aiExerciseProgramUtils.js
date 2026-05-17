const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export function normalizeWeeklySchedule(weeklySchedule) {
  const out = {};
  DAYS.forEach((day) => {
    out[day] = weeklySchedule?.[day] || weeklySchedule?.[day.toLowerCase()] || [];
  });
  return out;
}

export function defaultCompletion() {
  return {
    days: {},
    weeks: { "1": false, "2": false, "3": false, "4": false },
    month: false,
  };
}

function padWeeksToFour(mappedWeeks) {
  if (mappedWeeks.length >= 4) return mappedWeeks.slice(0, 4);
  const out = [...mappedWeeks];
  while (out.length < 4) {
    const last = out[out.length - 1];
    out.push({
      weekNumber: out.length + 1,
      weekLabel: `${out.length + 1}. Hafta`,
      focus: last.focus || "",
      weeklySummary: last.weeklySummary || "",
      weeklySchedule: JSON.parse(JSON.stringify(last.weeklySchedule)),
    });
  }
  return out;
}

/**
 * API / eski tek haftalık formatı birleştirir; completion alanını doldurur.
 */
export function normalizeMonthlyAiProgram(raw) {
  if (!raw) return null;

  const base = defaultCompletion();
  const c = raw.completion || {};
  const completion = {
    days: { ...base.days, ...(c.days || {}) },
    weeks: { ...base.weeks, ...(c.weeks || {}) },
    month: c.month === true,
  };

  if (Array.isArray(raw.weeks) && raw.weeks.length > 0) {
    const mapped = raw.weeks.map((w, i) => ({
      weekNumber: w.weekNumber || i + 1,
      weekLabel: w.weekLabel || `${i + 1}. Hafta`,
      focus: w.focus || "",
      weeklySummary: w.weeklySummary || "",
      weeklySchedule: normalizeWeeklySchedule(w.weeklySchedule || {}),
    }));
    const weeks = padWeeksToFour(mapped);
    return {
      version: raw.version || 2,
      monthlySummary: raw.monthlySummary || raw.weeklySummary || "",
      weeks,
      completion,
    };
  }

  if (raw.weeklySchedule) {
    const one = normalizeWeeklySchedule(raw.weeklySchedule);
    const weeks = [1, 2, 3, 4].map((n) => ({
      weekNumber: n,
      weekLabel: `${n}. Hafta`,
      focus: "",
      weeklySummary: raw.weeklySummary || "",
      weeklySchedule: JSON.parse(JSON.stringify(one)),
    }));
    return {
      version: raw.version || 1,
      monthlySummary: raw.monthlySummary || raw.weeklySummary || "",
      weeks,
      completion,
    };
  }

  return null;
}

export function dayCompletionKey(weekNum, day) {
  return `w${weekNum}-${day}`;
}

export function buildProgramPayloadForApi(monthlyProgram) {
  return { ...monthlyProgram, version: 2 };
}
