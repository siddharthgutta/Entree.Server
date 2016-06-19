import models from '../models/mongo/index.es6';

/**
 * IMPORTANT: Must return promises!
 */

/**
 * Returns a single producer given a query
 *
 * @param {Object} attributes: key value pairs of the attributes we want to query by
 * @returns {Promise}: returns a SocketToken object
 */
export async function findOne(attributes) {
  return await models.Producer.findOne(attributes).exec();
}
