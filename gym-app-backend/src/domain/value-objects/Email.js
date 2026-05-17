class Email {
  constructor(email) {
    if (!Email.isValid(email)) {
      throw new Error('Invalid email format');
    }
    this.value = email.toLowerCase();
  }

  static isValid(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toString() {
    return this.value;
  }

  equals(other) {
    return other instanceof Email && this.value === other.value;
  }
}

module.exports = Email;
