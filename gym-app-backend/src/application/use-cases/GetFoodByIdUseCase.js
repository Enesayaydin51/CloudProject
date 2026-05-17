const { FoodDTO } = require('../dtos/FoodDTO');

class GetFoodByIdUseCase {
  constructor(foodRepository) {
    this.foodRepository = foodRepository;
  }

  async execute(id) {
    const food = await this.foodRepository.findById(id);
    
    if (!food) {
      throw new Error('Food not found');
    }

    return FoodDTO.fromEntity(food);
  }
}

module.exports = GetFoodByIdUseCase;

