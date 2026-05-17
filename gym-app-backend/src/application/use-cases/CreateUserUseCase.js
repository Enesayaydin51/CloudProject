const { CreateUserDTO, UserDTO } = require('../dtos/UserDTO');
const User = require('../../domain/entities/User');

class CreateUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userData) {
    // Validate input data
    const createUserDTO = new CreateUserDTO(userData);
    const validationErrors = createUserDTO.validate();
    
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(createUserDTO.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user entity
    const user = User.create(
      createUserDTO.email,
      createUserDTO.password,
      createUserDTO.firstName,
      createUserDTO.lastName,
      createUserDTO.phoneNumber,
      createUserDTO.dateOfBirth
    );

    // Save to repository
    const savedUser = await this.userRepository.create(user);

    // Return DTO
    return UserDTO.fromEntity(savedUser);
  }
}

module.exports = CreateUserUseCase;
