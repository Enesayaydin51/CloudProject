class IFoodRepository {
  async findAll() {
    throw new Error('findAll method must be implemented');
  }

  async findById(id) {
    throw new Error('findById method must be implemented');
  }

  async findByName(name) {
    throw new Error('findByName method must be implemented');
  }

  async create(food) {
    throw new Error('create method must be implemented');
  }

  async update(id, food) {
    throw new Error('update method must be implemented');
  }

  async delete(id) {
    throw new Error('delete method must be implemented');
  }
}

module.exports = IFoodRepository;

