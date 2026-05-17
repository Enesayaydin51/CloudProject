const dbConnection = require('../database/connection');

class NutritionPlanRepository {
  constructor() {
    this.db = dbConnection;
  }

  /**
   * Yeni bir beslenme planı kaydeder
   */
  async create(userId, planData, planName = null) {
    const query = `
      INSERT INTO nutrition_plans (user_id, plan_data, plan_name, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, plan_data, plan_name, created_at, updated_at
    `;
    
    const values = [
      userId,
      JSON.stringify(planData),
      planName,
      new Date(),
      new Date()
    ];

    const result = await this.db.query(query, values);
    const row = result.rows[0];
    
    return {
      id: row.id,
      userId: row.user_id,
      planData: row.plan_data,
      planName: row.plan_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Kullanıcının kayıtlı beslenme planı sayısı
   */
  async countByUserId(userId) {
    const query = `
      SELECT COUNT(*)::int AS c
      FROM nutrition_plans
      WHERE user_id = $1
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows[0]?.c ?? 0;
  }

  /**
   * Kullanıcının bu takvim haftasındaki (Pazartesi'den itibaren) oluşturduğu plan sayısı
   */
  async countThisWeekByUserId(userId) {
    const query = `
      SELECT COUNT(*)::int AS c
      FROM nutrition_plans
      WHERE user_id = $1
        AND created_at >= date_trunc('week', CURRENT_DATE)
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows[0]?.c ?? 0;
  }

  /**
   * Kullanıcının tüm planlarını getirir
   */
  async findByUserId(userId, limit = 10, offset = 0) {
    const query = `
      SELECT id, user_id, plan_data, plan_name, created_at, updated_at
      FROM nutrition_plans
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.db.query(query, [userId, limit, offset]);
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      planData: row.plan_data,
      planName: row.plan_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * ID'ye göre plan getirir
   */
  async findById(planId) {
    const query = `
      SELECT id, user_id, plan_data, plan_name, created_at, updated_at
      FROM nutrition_plans
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [planId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      planData: row.plan_data,
      planName: row.plan_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Planı günceller
   */
  async update(planId, planData, planName = null) {
    const query = `
      UPDATE nutrition_plans
      SET plan_data = $1, plan_name = $2, updated_at = $3
      WHERE id = $4
      RETURNING id, user_id, plan_data, plan_name, created_at, updated_at
    `;
    
    const result = await this.db.query(query, [
      JSON.stringify(planData),
      planName,
      new Date(),
      planId
    ]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      planData: row.plan_data,
      planName: row.plan_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Planı siler
   */
  async delete(planId) {
    const query = 'DELETE FROM nutrition_plans WHERE id = $1';
    const result = await this.db.query(query, [planId]);
    return result.rowCount > 0;
  }

  /**
   * Kullanıcının en son planını getirir
   */
  async findLatestByUserId(userId) {
    const query = `
      SELECT id, user_id, plan_data, plan_name, created_at, updated_at
      FROM nutrition_plans
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await this.db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      planData: row.plan_data,
      planName: row.plan_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = NutritionPlanRepository;

