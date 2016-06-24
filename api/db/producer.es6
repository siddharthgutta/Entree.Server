import models from '../../models/mongo/index.es6';
import * as Utils from '../../libs/utils.es6';

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
  const producer = await Producer.findOne(attributes).exec();
  if (Utils.isEmpty(producer)) {
    throw new Error(`Could not find producer with attributes:${attributes}`);
  }
  return producer;
}
