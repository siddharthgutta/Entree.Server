import bcrypt from 'bcryptjs';

/**
 * Generates salt for hashing
 *
 * @returns {Promise}: the salt
 */
export async function genSalt() {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt((err, salt) => {
      if (err) reject(err);
      else resolve(salt);
    });
  });
}

/**
 * Hashes a password with a given salt
 *
 * @param {String} password: the password to hash
 * @param {String} salt: the salt used to encrypt
 * @returns {Promise}: the hashed password
 */
export async function hash(password, salt) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, salt, (err, hashedPassword) => {
      if (err) reject(err);
			else resolve(hashedPassword);
    });
  });
}

/**
 * Compares a candidate password with the one in the database after decryption
 *
 * @param {String} candidatePassword: the password to check
 * @param {String} encryption: the hash value
 * @returns {Promise}: whether or not the candidate password is a match
 */
export async function comparePassword(candidatePassword, encryption) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, encryption, (err, isMatch) => {
      if (err) reject(err);
      else resolve(isMatch);
    });
  });
}
