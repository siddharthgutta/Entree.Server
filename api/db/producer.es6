import models from '../../models/mongo/index.es6';

const Producer = models.Producer;

/**
 * IMPORTANT: Must return promises!
 */

/**
 * Creates a producer
 *
 * @param {Object} attributes: key value pairs of the attributes we want to populate the Producer with
 * @returns {Promise}: returns a Producer object
 */
export async function create(attributes) {
  return await (new Producer(attributes)).save();
}

/**
 * Returns a single producer given a query
 *
 * @param {Object} attributes: key value pairs of the attributes we want to query by
 * @returns {Promise}: returns a Producer object
 */
export async function findOne(attributes) {
  return await Producer.findOne(attributes).exec();
}
