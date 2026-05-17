const { FoodDTO } = require('../dtos/FoodDTO');

class GetFoodsUseCase {
  constructor(foodRepository) {
    this.foodRepository = foodRepository;
  }

  async execute(searchQuery = null) {
    let foods;
    
    if (searchQuery && searchQuery.trim()) {
      foods = await this.foodRepository.findByName(searchQuery.trim());
    } else {
      foods = await this.foodRepository.findAll();
    }

    return FoodDTO.fromArray(foods);
  }
}

module.exports = GetFoodsUseCase;

