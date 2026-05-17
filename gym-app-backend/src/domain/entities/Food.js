class Food {
  constructor(id, name, gramWeight, caloriesPerGram, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.gramWeight = gramWeight;
    this.caloriesPerGram = caloriesPerGram;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Factory method for creating new foods
  static create(name, gramWeight, caloriesPerGram) {
    const now = new Date();
    
    return new Food(
      null, // ID will be set by database
      name,
      gramWeight,
      caloriesPerGram,
      now,
      now
    );
  }

  // Business logic methods
  getTotalCalories() {
    return this.gramWeight * this.caloriesPerGram;
  }

  getCaloriesForWeight(weightInGrams) {
    return weightInGrams * this.caloriesPerGram;
  }

  // Validation methods
  static validateName(name) {
    return name && name.trim().length >= 2 && name.trim().length <= 255;
  }

  static validateGramWeight(gramWeight) {
    return gramWeight && gramWeight > 0 && gramWeight <= 100000;
  }

  static validateCaloriesPerGram(caloriesPerGram) {
    return caloriesPerGram && caloriesPerGram >= 0 && caloriesPerGram <= 10;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      gramWeight: parseFloat(this.gramWeight),
      caloriesPerGram: parseFloat(this.caloriesPerGram),
      totalCalories: this.getTotalCalories(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Food;

