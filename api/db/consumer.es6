import models from '../../models/mongo/index.es6';
import * as Utils from '../../libs/utils.es6';

const Consumer = models.Consumer;
/**
 * IMPORTANT: Must return promises!
 */

/**
 * Creates a consumer
 *
 * @param {Object} attributes: key value pairs of the attributes we want to populate the Consumer with
 * @returns {Promise}: returns a Consumer object
 */
export async function create(attributes) {
  return await (new Consumer(attributes)).save();
}

/**
 * Returns a single consumer given a query
 *
 * @param {Object} attributes: key value pairs of the attributes we want to query by
 * @returns {Promise}: returns the Consumer found
 */
export async function findOne(attributes) {
  const consumer = await Consumer.findOne(attributes).populate('context').exec();
  if (Utils.isEmpty(consumer)) {
    throw new Error(`Could not find consumer with attributes:${attributes}`);
  }
  return consumer;
}

/**
 * Updates a consumer with specific conditions
 *
 * @param {Object} conditions: conditions to find the consumer by
 * @param {Object} updates: update actions to apply to the consumer object
 * @param {Object} options: options to apply to the query
 * @returns {Promise}: returns the Consumer object
 */
export async function findOneAndUpdate(conditions, updates, options) {
  const consumer = await Consumer.findOneAndUpdate(conditions, updates, options).exec();
  if (Utils.isEmpty(consumer)) {
    throw new Error(`Could not find and update merchant with attributes: ${conditions} with updates ${updates}`);
  }
  return consumer;
}
