import models from '../../models/mongo/index.es6';
const Hours = models.Hour;

/**
 * IMPORTANT: Must return promises!
 * @param {*} attributes: the attributes to add to the hour of the producers
 * @returns {Promise} the created object
=======
const Hours = models.hours;

/**
 * IMPORTANT: Must return promises!
<<<<<<< cc31fc0532d0172d21d00de9e0d9adafbab57240
>>>>>>> added hours to the producers and functions to access and change them
=======
 * @param {String} attributes: the attributes to add to the hour of the producers
 * @returns {Promise} the created object
>>>>>>> fixed the pull request comments
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
