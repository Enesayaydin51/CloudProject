const IFoodRepository = require('../../domain/repositories/IFoodRepository');
const Food = require('../../domain/entities/Food');
const dbConnection = require('../database/connection');

class FoodRepository extends IFoodRepository {
  constructor() {
    super();
    this.db = dbConnection;
  }

  async findAll() {
    const query = `
      SELECT id, name, gram_weight, calories_per_gram, created_at, updated_at
      FROM foods
      ORDER BY name ASC
    `;
    
    const result = await this.db.query(query);
    
    return result.rows.map(row => new Food(
      row.id,
      row.name,
      row.gram_weight,
      row.calories_per_gram,
      row.created_at,
      row.updated_at
    ));
  }

  async findById(id) {
    const query = `
      SELECT id, name, gram_weight, calories_per_gram, created_at, updated_at
      FROM foods
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return new Food(
      row.id,
      row.name,
      row.gram_weight,
      row.calories_per_gram,
      row.created_at,
      row.updated_at
    );
  }

  async findByName(name) {
    const query = `
      SELECT id, name, gram_weight, calories_per_gram, created_at, updated_at
      FROM foods
      WHERE LOWER(name) LIKE LOWER($1)
      ORDER BY name ASC
    `;
    
    const result = await this.db.query(query, [`%${name}%`]);
    
    return result.rows.map(row => new Food(
      row.id,
      row.name,
      row.gram_weight,
      row.calories_per_gram,
      row.created_at,
      row.updated_at
    ));
  }

  async create(food) {
    const query = `
      INSERT INTO foods (name, gram_weight, calories_per_gram, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, gram_weight, calories_per_gram, created_at, updated_at
    `;
    
    const values = [
      food.name,
      food.gramWeight,
      food.caloriesPerGram,
      food.createdAt,
      food.updatedAt
    ];

    const result = await this.db.query(query, values);
    const row = result.rows[0];
    
    return new Food(
      row.id,
      row.name,
      row.gram_weight,
      row.calories_per_gram,
      row.created_at,
      row.updated_at
    );
  }

  async update(id, food) {
    const query = `
      UPDATE foods
      SET name = $1, gram_weight = $2, calories_per_gram = $3, updated_at = $4
      WHERE id = $5
      RETURNING id, name, gram_weight, calories_per_gram, created_at, updated_at
    `;
    
    const values = [
      food.name,
      food.gramWeight,
      food.caloriesPerGram,
      new Date(),
      id
    ];

    const result = await this.db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return new Food(
      row.id,
      row.name,
      row.gram_weight,
      row.calories_per_gram,
      row.created_at,
      row.updated_at
    );
  }

  async delete(id) {
    const query = `
      DELETE FROM foods
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await this.db.query(query, [id]);
    
    return result.rows.length > 0;
  }
}

module.exports = FoodRepository;

