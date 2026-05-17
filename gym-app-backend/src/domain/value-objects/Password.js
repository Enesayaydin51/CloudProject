const bcrypt = require('bcryptjs');

class Password {
  constructor(password, isHashed = false) {
    if (!isHashed && !Password.isValid(password)) {
      throw new Error('Password must be at least 8 characters long and contain at least one letter and one number');
    }
    this.value = isHashed ? password : bcrypt.hashSync(password, 10);
  }

  static isValid(password) {
    // Minimum 8 characters, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }

  validate(plainPassword) {
    return bcrypt.compareSync(plainPassword, this.value);
  }

  toString() {
    return this.value;
  }

  equals(other) {
    return other instanceof Password && this.value === other.value;
  }
}

module.exports = Password;
