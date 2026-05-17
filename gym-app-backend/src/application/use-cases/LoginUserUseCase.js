const { LoginDTO, UserDTO } = require('../dtos/UserDTO');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');

class LoginUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(loginData) {
    // Validate input data
    const loginDTO = new LoginDTO(loginData);
    const validationErrors = loginDTO.validate();
    
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(loginDTO.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Validate password
    if (!user.validatePassword(loginDTO.password)) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Return user data and token
    return {
      user: UserDTO.fromEntity(user),
      token
    };
  }
}

module.exports = LoginUserUseCase;
