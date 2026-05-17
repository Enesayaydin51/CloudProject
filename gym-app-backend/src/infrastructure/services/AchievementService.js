const UserRepository = require('../repositories/UserRepository');
const AIExerciseProgramRepository = require('../repositories/AIExerciseProgramRepository');
const NutritionPlanRepository = require('../repositories/NutritionPlanRepository');
const AchievementRepository = require('../repositories/AchievementRepository');
const UserXpRepository = require('../repositories/UserXpRepository');
const { UserDTO } = require('../../application/dtos/UserDTO');

const XP_PER_LEVEL = 100;

function levelProgressFromTotalXp(totalXp) {
  const safe = Math.max(0, Number(totalXp) || 0);
  const level = 1 + Math.floor(safe / XP_PER_LEVEL);
  const xpIntoLevel = safe % XP_PER_LEVEL;
  const progress = xpIntoLevel / XP_PER_LEVEL;
  return {
    level,
    totalXp: safe,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    progressToNextLevel: progress,
  };
}

class AchievementService {
  constructor() {
    this.userRepository = new UserRepository();
    this.exerciseProgramRepository = new AIExerciseProgramRepository();
    this.nutritionPlanRepository = new NutritionPlanRepository();
    this.achievementRepository = new AchievementRepository();
    this.userXpRepository = new UserXpRepository();
  }

  /**
   * Tüm kuralları veritabanı durumundan yeniden değerlendirir (retroaktif rozetler).
   * @returns {Promise<Array<{ code: string, title: string, description: string }>>} Bu senkronizasyonda yeni açılan rozetler
   */
  async syncUserAchievements(userId) {
    const definitions = await this.achievementRepository.listDefinitions();
    const metaByCode = new Map(definitions.map((d) => [d.code, { title: d.title, description: d.description || '' }]));

    const newlyUnlocked = [];

    const unlock = async (code) => {
      const inserted = await this.achievementRepository.tryUnlock(userId, code);
      if (inserted) {
        const m = metaByCode.get(code);
        newlyUnlocked.push({
          code,
          title: m?.title || code,
          description: m?.description || '',
        });
      }
    };

    const [
      exerciseCount,
      nutritionCount,
      userDetails,
      userEntity,
      programs,
    ] = await Promise.all([
      this.exerciseProgramRepository.countByUserId(userId),
      this.nutritionPlanRepository.countByUserId(userId),
      this.userRepository.getUserDetails(userId),
      this.userRepository.findById(userId),
      this.exerciseProgramRepository.findByUserId(userId, 200, 0),
    ]);

    if (exerciseCount >= 1) {
      await unlock('first_ai_exercise_plan');
    }
    if (nutritionCount >= 1) {
      await unlock('first_nutrition_plan');
    }

    const profileOk =
      userDetails &&
      userDetails.height != null &&
      userDetails.weight != null &&
      userDetails.goal != null &&
      String(userDetails.goal).trim() !== '';
    if (profileOk) {
      await unlock('profile_complete');
    }

    if (userEntity && UserDTO.isProActive(userEntity)) {
      await unlock('pro_member');
    }

    let maxDayCompletions = 0;
    let anyMonthDone = false;
    for (const p of programs || []) {
      let data = p.programData;
      try {
        if (typeof data === 'string') data = JSON.parse(data);
      } catch {
        continue;
      }
      const completion = data?.completion;
      if (!completion) continue;
      const days = completion.days && typeof completion.days === 'object' ? completion.days : {};
      const n = Object.values(days).filter((v) => v === true).length;
      if (n > maxDayCompletions) maxDayCompletions = n;
      if (completion.month === true) anyMonthDone = true;
    }
    if (maxDayCompletions >= 7) {
      await unlock('ai_exercise_days_7');
    }
    if (maxDayCompletions >= 30) {
      await unlock('ai_exercise_days_30');
    }
    if (anyMonthDone) {
      await unlock('ai_exercise_month_done');
    }

    return newlyUnlocked;
  }

  /**
   * API yanıtı: tanımlar + kilit + özet seviye
   */
  async getAchievementState(userId) {
    const definitions = await this.achievementRepository.listDefinitions();
    const unlockedMap = await this.achievementRepository.getUnlockedByUserId(userId);

    let badgeXp = 0;
    const achievements = definitions.map((d) => {
      const unlockedAt = unlockedMap[d.code] ?? null;
      const unlocked = !!unlockedAt;
      if (unlocked) badgeXp += d.xp || 0;
      return {
        id: d.id,
        code: d.code,
        title: d.title,
        description: d.description,
        iconKey: d.iconKey,
        xp: d.xp,
        category: d.category,
        tier: d.tier,
        sortOrder: d.sortOrder,
        unlocked,
        unlockedAt,
      };
    });

    const activityXp = await this.userXpRepository.sumActivityXpByUserId(userId);
    const totalXp = badgeXp + activityXp;

    const summary = {
      ...levelProgressFromTotalXp(totalXp),
      badgeXp,
      activityXp,
      unlockedCount: Object.keys(unlockedMap).length,
      totalDefinitions: definitions.length,
    };

    return { achievements, summary };
  }
}

module.exports = AchievementService;
