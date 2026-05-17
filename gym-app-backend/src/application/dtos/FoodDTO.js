const Food = require('../../domain/entities/Food');

class FoodDTO {
  constructor(food) {
    this.id = food.id;
    this.name = food.name;
    this.gramWeight = food.gramWeight;
    this.caloriesPerGram = food.caloriesPerGram;
    this.totalCalories = food.getTotalCalories();
    this.createdAt = food.createdAt;
    this.updatedAt = food.updatedAt;
  }

  static fromEntity(food) {
    return new FoodDTO(food);
  }

  static fromArray(foods) {
    return foods.map(food => new FoodDTO(food));
  }
}

class CreateFoodDTO {
  constructor(data) {
    this.name = data.name;
    this.gramWeight = data.gramWeight;
    this.caloriesPerGram = data.caloriesPerGram;
  }

  validate() {
    const errors = [];

    if (!this.name || !Food.validateName(this.name)) {
      errors.push('Name must be between 2 and 255 characters');
    }

    if (!this.gramWeight || !Food.validateGramWeight(this.gramWeight)) {
      errors.push('Gram weight must be between 0 and 100000');
    }

    if (this.caloriesPerGram === undefined || this.caloriesPerGram === null || !Food.validateCaloriesPerGram(this.caloriesPerGram)) {
      errors.push('Calories per gram must be between 0 and 10');
    }

    return errors;
  }
}

class UpdateFoodDTO {
  constructor(data) {
    this.name = data.name;
    this.gramWeight = data.gramWeight;
    this.caloriesPerGram = data.caloriesPerGram;
  }

  validate() {
    const errors = [];

    if (this.name !== undefined && !Food.validateName(this.name)) {
      errors.push('Name must be between 2 and 255 characters');
    }

    if (this.gramWeight !== undefined && !Food.validateGramWeight(this.gramWeight)) {
      errors.push('Gram weight must be between 0 and 100000');
    }

    if (this.caloriesPerGram !== undefined && this.caloriesPerGram !== null && !Food.validateCaloriesPerGram(this.caloriesPerGram)) {
      errors.push('Calories per gram must be between 0 and 10');
    }

    return errors;
  }
}

module.exports = {
  FoodDTO,
  CreateFoodDTO,
  UpdateFoodDTO
};

