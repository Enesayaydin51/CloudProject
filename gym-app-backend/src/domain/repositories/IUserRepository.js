class IUserRepository {
  async create(user) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async update(id, userData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async findAll(limit = 10, offset = 0) {
    throw new Error('Method not implemented');
  }

  async existsByEmail(email) {
    throw new Error('Method not implemented');
  }
}

module.exports = IUserRepository;
