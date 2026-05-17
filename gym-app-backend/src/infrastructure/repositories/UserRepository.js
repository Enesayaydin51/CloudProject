const IUserRepository = require('../../domain/repositories/IUserRepository');
const User = require('../../domain/entities/User');
const dbConnection = require('../database/connection');

function rowToUser(row) {
  if (!row) return null;
  return new User(
    row.id,
    row.email,
    row.password,
    row.first_name,
    row.last_name,
    row.phone_number,
    row.date_of_birth,
    row.created_at,
    row.updated_at,
    row.avatar_data_url ?? null,
    row.membership_tier ?? 'free',
    row.pro_expires_at ?? null
  );
}

const USER_ROW_SELECT = `
  id, email, password, first_name, last_name, phone_number, date_of_birth, created_at, updated_at, avatar_data_url,
  membership_tier, pro_expires_at
`;

class UserRepository extends IUserRepository {
  constructor() {
    super();
    this.db = dbConnection;
  }

  async create(user) {
    const query = `
      INSERT INTO users (email, password, first_name, last_name, phone_number, date_of_birth, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING ${USER_ROW_SELECT}
    `;
    
    const values = [
      user.email,
      user.password,
      user.firstName,
      user.lastName,
      user.phoneNumber,
      user.dateOfBirth,
      user.createdAt,
      user.updatedAt
    ];

    const result = await this.db.query(query, values);
    return rowToUser(result.rows[0]);
  }

  async findById(id) {
    const query = `
      SELECT ${USER_ROW_SELECT}
      FROM users
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return rowToUser(result.rows[0]);
  }

  async findByEmail(email) {
    const query = `
      SELECT ${USER_ROW_SELECT}
      FROM users
      WHERE email = $1
    `;
    
    const result = await this.db.query(query, [email.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return rowToUser(result.rows[0]);
  }

  async update(id, userData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(userData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING ${USER_ROW_SELECT}
    `;

    const result = await this.db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return rowToUser(result.rows[0]);
  }

  async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rowCount > 0;
  }

  async findAll(limit = 10, offset = 0) {
    const query = `
      SELECT ${USER_ROW_SELECT}
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await this.db.query(query, [limit, offset]);
    
    return result.rows.map((row) => rowToUser(row));
  }

  /**
   * Pro üyelik: mevcut bitiş tarihinden veya bugünden itibaren 30 gün ekler (demo / ödeme simülasyonu).
   */
  async activateProSubscription(userId, days = 30) {
    const user = await this.findById(userId);
    if (!user) return null;
    const now = new Date();
    const currentEnd = user.proExpiresAt ? new Date(user.proExpiresAt) : null;
    const base = currentEnd && currentEnd > now ? currentEnd : now;
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    const result = await this.db.query(
      `UPDATE users SET membership_tier = $1, pro_expires_at = $2, updated_at = $3 WHERE id = $4 RETURNING ${USER_ROW_SELECT}`,
      ['pro', next, new Date(), userId]
    );
    return rowToUser(result.rows[0]);
  }

  /**
   * Pro üyeliği iptal: free tier, bitiş tarihi temizlenir.
   */
  async cancelProSubscription(userId) {
    const result = await this.db.query(
      `UPDATE users SET membership_tier = $1, pro_expires_at = $2, updated_at = $3 WHERE id = $4 RETURNING ${USER_ROW_SELECT}`,
      ['free', null, new Date(), userId]
    );
    if (result.rows.length === 0) return null;
    return rowToUser(result.rows[0]);
  }

  async existsByEmail(email) {
    const query = 'SELECT 1 FROM users WHERE email = $1 LIMIT 1';
    const result = await this.db.query(query, [email.toLowerCase()]);
    return result.rows.length > 0;
  }

  async getUserDetails(userId) {
    const query = `
      SELECT height, weight, injuries, goal, gender, age, created_at, updated_at
      FROM user_details
      WHERE user_id = $1
    `;
    
    const result = await this.db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  async updateUserDetails(userId, details) {
    const query = `
      INSERT INTO user_details (user_id, height, weight, injuries, goal, gender, age, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id)
      DO UPDATE SET
        height = EXCLUDED.height,
        weight = EXCLUDED.weight,
        injuries = EXCLUDED.injuries,
        goal = EXCLUDED.goal,
        gender = EXCLUDED.gender,
        age = EXCLUDED.age,
        updated_at = EXCLUDED.updated_at
      RETURNING height, weight, injuries, goal, gender, age, created_at, updated_at
    `;
    
    const values = [
      userId,
      details.height,
      details.weight,
      details.injuries,
      details.goal || null,
      details.gender || null,
      details.age != null ? parseInt(details.age, 10) : null,
      new Date(),
      new Date()
    ];
    
    const result = await this.db.query(query, values);
    return result.rows[0];
  }
}

module.exports = UserRepository;
