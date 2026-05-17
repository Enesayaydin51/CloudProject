const UserXpRepository = require('../repositories/UserXpRepository');

const XP_DAILY_WORKOUT = 20;
const XP_WEEK_COMPLETE = 40;
const XP_MONTH_COMPLETE = 100;

function parseProgram(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return typeof raw === 'object' ? raw : null;
}

function getCompletion(prog) {
  const c = prog?.completion;
  return c && typeof c === 'object' ? c : {};
}

/** UTC YYYY-MM-DD */
function utcDateString(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/**
 * Egzersiz programı completion değişimine göre aktivite XP yazar (idempotent).
 * @returns {Promise<Array<{ amount: number, reason: string }>>}
 */
async function awardExerciseCompletionXp(userId, programId, oldProgramRaw, newProgramObj, userXpRepository) {
  const granted = [];
  const oldP = parseProgram(oldProgramRaw);
  const newP = parseProgram(newProgramObj);
  const oldC = getCompletion(oldP);
  const newC = getCompletion(newP);

  const oldDays = oldC.days && typeof oldC.days === 'object' ? oldC.days : {};
  const newDays = newC.days && typeof newC.days === 'object' ? newC.days : {};
  const oldWeeks = oldC.weeks && typeof oldC.weeks === 'object' ? oldC.weeks : {};
  const newWeeks = newC.weeks && typeof newC.weeks === 'object' ? newC.weeks : {};
  const oldMonth = !!oldC.month;
  const newMonth = !!newC.month;

  // Ay: false -> true
  if (!oldMonth && newMonth) {
    const dedupe = `month:${programId}`;
    const r = await userXpRepository.tryInsertLedger(
      userId,
      XP_MONTH_COMPLETE,
      'month_complete',
      dedupe,
      programId
    );
    if (r.inserted) {
      granted.push({ amount: XP_MONTH_COMPLETE, reason: 'month_complete' });
    }
  }

  // Haftalar: her hafta numarası için false -> true
  const weekKeys = new Set([...Object.keys(oldWeeks), ...Object.keys(newWeeks)]);
  for (const w of weekKeys) {
    const o = oldWeeks[w] === true;
    const n = newWeeks[w] === true;
    if (!o && n) {
      const dedupe = `week:${programId}:${w}`;
      const r = await userXpRepository.tryInsertLedger(
        userId,
        XP_WEEK_COMPLETE,
        'week_complete',
        dedupe,
        programId
      );
      if (r.inserted) {
        granted.push({ amount: XP_WEEK_COMPLETE, reason: 'week_complete' });
      }
    }
  }

  // Gün: herhangi bir gün ilk kez true olduysa, UTC günü başına bir +20
  let anyNewDayDone = false;
  const dayKeys = new Set([...Object.keys(oldDays), ...Object.keys(newDays)]);
  for (const k of dayKeys) {
    const o = oldDays[k] === true;
    const n = newDays[k] === true;
    if (!o && n) {
      anyNewDayDone = true;
      break;
    }
  }

  if (anyNewDayDone) {
    const dateStr = utcDateString();
    const dedupe = `daily:${dateStr}`;
    const r = await userXpRepository.tryInsertLedger(
      userId,
      XP_DAILY_WORKOUT,
      'daily_workout',
      dedupe,
      programId
    );
    if (r.inserted) {
      granted.push({ amount: XP_DAILY_WORKOUT, reason: 'daily_workout' });
    }
  }

  return granted;
}

module.exports = {
  awardExerciseCompletionXp,
  XP_DAILY_WORKOUT,
  XP_WEEK_COMPLETE,
  XP_MONTH_COMPLETE,
};
