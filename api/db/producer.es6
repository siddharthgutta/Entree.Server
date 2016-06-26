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
  const producer = await Producer.findOne(attributes).populate('merchant').exec();
  if (Utils.isEmpty(producer)) {
    throw new Error(`Could not find producer with attributes:${attributes}`);
  }
  return producer;
}

/**
 * Returns a Query object for finding producers
 *
 * @param {Object} conditions: key value pairs of the conditions we want to query by
 * @returns {Query}: returns a Producer query
 */
export async function find(conditions) {
  return await Producer.find(conditions).populate('merchant');
}


/**
 * Find one merchant and update it
 *
 * @param {Object} conditions: conditions to query on
 * @param {Object} updates: updates to apply to the merchant
 * @param {Object} options: options to modify the query
 * @returns {Promise}: returns the Merchant object
 */
export async function findOneAndUpdate(conditions, updates, options = null) {
  const producer = await Producer.findOneAndUpdate(conditions, updates, options).exec();
  if (Utils.isEmpty(producer)) {
    throw new Error(`Could not find and update merchant with attributes: ${conditions} with updates ${updates}`);
  }
  return producer;
}
