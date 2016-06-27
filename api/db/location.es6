import models from '../../models/mongo/index.es6';
import * as Utils from '../../libs/utils.es6';

const Location = models.Location;

/**
 * IMPORTANT: Must return promises!
 */

/**
 * Creates a location
 *
 * @param {Object} attributes: key value pairs of the attributes we want to populate the Location with
 * @returns {Promise}: returns a Location object
 */
export async function create(attributes) {
  return await (new Location(attributes)).save();
}

/**
 * Returns a single location given a query
 *
 * @param {Object} attributes: key value pairs of the attributes we want to query by
 * @returns {Promise}: returns a Location object
 */
export async function findOne(attributes) {
  const location = await Location.findOne(attributes).exec();
  if (Utils.isEmpty(location)) {
    throw new Error(`Could not find location with attributes:${attributes}`);
  }
  return location;
}
