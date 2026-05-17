const dbConnection = require('../database/connection');

class UserXpRepository {
  constructor() {
    this.db = dbConnection;
  }

  /**
   * @returns {Promise<{ inserted: boolean, row?: object }>}
   */
  async tryInsertLedger(userId, amount, reason, dedupeKey, programId = null) {
    const query = `
      INSERT INTO user_xp_ledger (user_id, amount, reason, dedupe_key, program_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, dedupe_key) DO NOTHING
      RETURNING id, user_id, amount, reason, dedupe_key, program_id, created_at
    `;
    const result = await this.db.query(query, [userId, amount, reason, dedupeKey, programId]);
    if (result.rows.length === 0) {
      return { inserted: false };
    }
    return { inserted: true, row: result.rows[0] };
  }

  /**
   * @returns {Promise<number>}
   */
  async sumActivityXpByUserId(userId) {
    const query = `
      SELECT COALESCE(SUM(amount), 0)::int AS total
      FROM user_xp_ledger
      WHERE user_id = $1
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows[0]?.total ?? 0;
  }
}

module.exports = UserXpRepository;
