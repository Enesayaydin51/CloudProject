const AchievementService = require('../../infrastructure/services/AchievementService');

class AchievementController {
  constructor() {
    this.achievementService = new AchievementService();
  }

  /**
   * GET /api/auth/achievements
   * Rozet kataloğu + kullanıcı durumu; her çağrıda kurallar senkronize edilir.
   */
  async getMyAchievements(req, res, next) {
    try {
      const userId = req.user.id;
      const newlyUnlocked = await this.achievementService.syncUserAchievements(userId);
      const data = await this.achievementService.getAchievementState(userId);
      res.status(200).json({
        success: true,
        data: {
          ...data,
          newlyUnlocked,
        },
      });
    } catch (error) {
      console.error('Get achievements error:', error);
      next(error);
    }
  }
}

module.exports = AchievementController;
