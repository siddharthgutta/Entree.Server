import models from '../../models/mongo/index.es6';
import * as Utils from '../../libs/utils.es6';
import _ from 'lodash';

const User = models.User;

/**
 * Creates a new user object
 *
 * @param {Object} attributes: key value pairs of teh attributes of the user
 * @returns {Promise}: returns the User found
 */
export async function create(attributes) {
  return await (new User(attributes)).save();
}

/**
 * Returns a single user given a query
 *
 * @param {Object} attributes: key value pairs of the attributes we want to query by
 * @returns {Promise}: returns the User found
 */
export async function findOne(attributes, populateFields = []) {
  let findQuery = User.findOne(attributes);
  findQuery = _.reduce(populateFields, (query, field) =>
      findQuery.populate(field),
    findQuery);
  const user = await findQuery.exec();
  if (Utils.isEmpty(user)) {
    throw new Error(`Could not find user with attributes:${attributes}`);
  }
  return user;
}

/**
 * Updates a user with specific conditions
 *
 * @param {Object} conditions: conditions to find the user by
 * @param {Object} updates: update actions to apply to the user object
 * @param {Object} options: options to apply to the query
 * @returns {Promise}: returns the User object
 */
export async function findOneAndUpdate(conditions, updates, options) {
  const user = await User.findOneAndUpdate(conditions, updates, options).exec();
  if (Utils.isEmpty(user)) {
    throw new Error(`Could not find and update user with attributes: ${conditions} with updates ${updates}`);
  }
  return user;
}
