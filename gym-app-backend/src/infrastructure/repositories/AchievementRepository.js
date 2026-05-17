const dbConnection = require('../database/connection');

class AchievementRepository {
  constructor() {
    this.db = dbConnection;
  }

  async listDefinitions() {
    const q = `
      SELECT id, code, title, description, icon_key, xp, category, tier, sort_order
      FROM achievement_definitions
      ORDER BY sort_order ASC, id ASC
    `;
    const result = await this.db.query(q);
    return result.rows.map((row) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      iconKey: row.icon_key,
      xp: row.xp,
      category: row.category,
      tier: row.tier,
      sortOrder: row.sort_order,
    }));
  }

  /**
   * @returns {Promise<Record<string, string|null>>} code -> ISO unlocked_at
   */
  async getUnlockedByUserId(userId) {
    const q = `
      SELECT ad.code, ua.unlocked_at
      FROM user_achievements ua
      JOIN achievement_definitions ad ON ad.id = ua.achievement_id
      WHERE ua.user_id = $1
    `;
    const result = await this.db.query(q, [userId]);
    const map = {};
    for (const row of result.rows) {
      map[row.code] = row.unlocked_at ? new Date(row.unlocked_at).toISOString() : null;
    }
    return map;
  }

  /**
   * Rozeti aç; zaten varsa false döner.
   */
  async tryUnlock(userId, code) {
    const q = `
      INSERT INTO user_achievements (user_id, achievement_id)
      SELECT $1, id FROM achievement_definitions WHERE code = $2
      ON CONFLICT (user_id, achievement_id) DO NOTHING
      RETURNING achievement_id
    `;
    const result = await this.db.query(q, [userId, code]);
    return result.rowCount > 0;
  }
}

module.exports = AchievementRepository;
