import * as User from '../db/user.es6';
import * as bcrypt from '../../libs/auth/bcrypt.es6';

/**
 * Creates a user with the given attributes
 *
 * @param {String} username: username of the user
 * @param {String} password: password of the user
 * @param {Object} optional: optional attributes
 * @returns {Promise}: the created user
 * @private
 */
export async function _create(username, password, optional = {}) {
  return await User.create({username, password, ...optional});
}

/**
 * Creates a user after hashing the password
 *
 * @param {String} username: username of the user
 * @param {String} password: password of the user
 * @param {Object} optional: optional attributes
 * @returns {Promise}: the created user
 */
export async function create(username, password, optional = {}) {
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);
  return await _create(username, hashedPassword, optional);
}

/**
 * Finds a user in the database using the username
 *
 * @param {String} username: the username of the user to find
 * @returns {Promise}: the found user
 */
export async function findByUsername(username) {
  return await User.findOne({username});
}

/**
 * Finds a user in the database using the username
 *
 * @param {String} id: the id of the user to find
 * @returns {Promise}: the found user
 */
export async function findOneById(id) {
  return await User.findOne({_id: id});
}

/**
 * Compares a candidate password with the one in the database after decryption
 *
 * @param {String} candidatePassword: the password to check
 * @param {String} hash: the hashed password
 * @returns {Promise<Boolean>}: whether or not the passwords match
 */
export async function comparePassword(candidatePassword, hash) {
  return await bcrypt.comparePassword(candidatePassword, hash);
}
