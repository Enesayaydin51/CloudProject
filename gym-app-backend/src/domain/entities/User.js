const bcrypt = require('bcryptjs');

class User {
  constructor(
    id,
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
    dateOfBirth,
    createdAt,
    updatedAt,
    avatarDataUrl = null,
    membershipTier = 'free',
    proExpiresAt = null
  ) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phoneNumber = phoneNumber;
    this.dateOfBirth = dateOfBirth;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.avatarDataUrl = avatarDataUrl;
    this.membershipTier = membershipTier;
    this.proExpiresAt = proExpiresAt;
  }

  // Factory method for creating new users
  static create(email, password, firstName, lastName, phoneNumber, dateOfBirth) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const now = new Date();
    
    return new User(
      null, // ID will be set by database
      email,
      hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      now,
      now,
      null,
      'free',
      null
    );
  }

  // Business logic methods
  validatePassword(password) {
    return bcrypt.compareSync(password, this.password);
  }

  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  getAge() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Validation methods
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    // Minimum 8 characters, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static validatePhoneNumber(phoneNumber) {
    // Turkish phone number format
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
    return phoneRegex.test(phoneNumber);
  }

  // Convert to JSON (exclude password)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;
