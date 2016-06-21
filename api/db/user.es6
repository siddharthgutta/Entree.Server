import models from '../../models/mongo/index.es6';

const User = models.User;
/**
 * IMPORTANT: Must return promises!
 */

/**
 * Creates a user
 *
 * @param {Object} attributes: key value pairs of the attributes we want to populate the User with
 * @returns {Promise}: returns a User object
 */
export async function create(attributes) {
  return await (new User(attributes)).save();
}

/**
 * Returns a single user given a query
 *
 * @param {Object} attributes: key value pairs of the attributes we want to query by
 * @returns {Promise}: returns a SocketToken object
 */
export async function findOne(attributes) {
  return await User.findOne(attributes).exec();
}
