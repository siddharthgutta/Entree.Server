import models from '../../models/mongo/index.es6';
const Hours = models.Hour;

/**
 * Creates an hour object based off the schema
 * @param {*} attributes: the attributes to add to the hour of the producers
 * @returns {Promise} the created object
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
  return await Hours.findOne(attributes).exec();
}
