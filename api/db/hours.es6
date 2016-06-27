import models from '../../models/mongo/index.es6';
const Hours = models.hours;

/**
 * IMPORTANT: Must return promises!
 */

export async function create(attributes) {
  return await (new Hours(attributes)).save();
}
/**
*Returns an hours object given a query
*@param {Object} attributes: key value pairs of the attributes we want to query by
*@returns {Promise}: returns a SocketToken object
*/
export async function findOne(attributes) {
  return await models.Hours.findOne(attributes).exec();
}
