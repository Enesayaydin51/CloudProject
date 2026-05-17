const dbConnection = require('../database/connection');

class AIExerciseProgramRepository {
  constructor() {
    this.db = dbConnection;
  }

  /**
   * Yeni bir AI egzersiz programı kaydeder
   */
  async create(userId, programData, programName = null) {
    const query = `
      INSERT INTO ai_exercise_programs (user_id, program_data, program_name, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, program_data, program_name, created_at, updated_at
    `;
    
    const values = [
      userId,
      JSON.stringify(programData),
      programName,
      new Date(),
      new Date()
    ];

    const result = await this.db.query(query, values);
    const row = result.rows[0];
    
    return {
      id: row.id,
      userId: row.user_id,
      programData: typeof row.program_data === 'string' ? JSON.parse(row.program_data) : row.program_data,
      programName: row.program_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Kullanıcının kayıtlı AI egzersiz programı sayısı
   */
  async countByUserId(userId) {
    const query = `
      SELECT COUNT(*)::int AS c
      FROM ai_exercise_programs
      WHERE user_id = $1
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows[0]?.c ?? 0;
  }

  /**
   * Kullanıcının bu takvim haftasındaki (Pazartesi'den itibaren) oluşturduğu program sayısı
   */
  async countThisWeekByUserId(userId) {
    const query = `
      SELECT COUNT(*)::int AS c
      FROM ai_exercise_programs
      WHERE user_id = $1
        AND created_at >= date_trunc('week', CURRENT_DATE)
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows[0]?.c ?? 0;
  }

  /**
   * Kullanıcının tüm programlarını getirir
   */
  async findByUserId(userId, limit = 10, offset = 0) {
    const query = `
      SELECT id, user_id, program_data, program_name, created_at, updated_at
      FROM ai_exercise_programs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.db.query(query, [userId, limit, offset]);
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      programData: typeof row.program_data === 'string' ? JSON.parse(row.program_data) : row.program_data,
      programName: row.program_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * ID'ye göre program getirir
   */
  async findById(programId) {
    const query = `
      SELECT id, user_id, program_data, program_name, created_at, updated_at
      FROM ai_exercise_programs
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [programId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      programData: typeof row.program_data === 'string' ? JSON.parse(row.program_data) : row.program_data,
      programName: row.program_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Kullanıcının en son programını getirir
   */
  async findLatestByUserId(userId) {
    const query = `
      SELECT id, user_id, program_data, program_name, created_at, updated_at
      FROM ai_exercise_programs
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
      programData: typeof row.program_data === 'string' ? JSON.parse(row.program_data) : row.program_data,
      programName: row.program_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Programı günceller
   */
  async update(programId, programData, programName = null) {
    const query = `
      UPDATE ai_exercise_programs
      SET program_data = $1, program_name = $2, updated_at = $3
      WHERE id = $4
      RETURNING id, user_id, program_data, program_name, created_at, updated_at
    `;
    
    const result = await this.db.query(query, [
      JSON.stringify(programData),
      programName,
      new Date(),
      programId
    ]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      programData: typeof row.program_data === 'string' ? JSON.parse(row.program_data) : row.program_data,
      programName: row.program_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Programı siler
   */
  async delete(programId) {
    const query = 'DELETE FROM ai_exercise_programs WHERE id = $1';
    const result = await this.db.query(query, [programId]);
    return result.rowCount > 0;
  }
}

module.exports = AIExerciseProgramRepository;

