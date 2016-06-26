/**
 * Created by kfu on 6/22/16.
 */

import * as Producer from '../db/producer.es6';
import * as Merchant from '../controllers/merchant.es6';

/**
 * Find the producer from its object id
 *
 * @param {ObjectId} _id: object id of the producer object
 * @returns {Promise<Producer>}: the producer with the specific id
 */
export async function findOneByObjectId(_id) {
  return await Producer.findOne({_id});
}

/**
 * Find enabled producers
 *
 * @param {Object} conditions: conditions to query on
 * @param {Number} sampleSize: size of random sample of producers to find
 * @returns {Promise}: returns the producers found
 */
export async function findEnabled(conditions, sampleSize) {
  const producersQuery = (await Producer.find(conditions));
  return await producersQuery.sample(sampleSize).exec();
}

/**
 * Create a producer in the database
 *
 * @param {String} name: name of the producer
 * @param {String} password: password for the producer
 * @param {String} description: description of the producer
 * @param {Object} optional: optional fields for the producer
 * @returns {Promise<Producer>}: the producer that was just created
 */
export async function _create(name, password, description, optional = {}) {
  return await Producer.create({name, password, description, ...optional});
}

/**
 * Creates a producer as a merchant
 *
 * @param {String} name: name of the producer
 * @param {String} password: password of the producer
 * @param {String} description: description of the producer
 * @param {Number} percentageFee: percentageFee of the producer
 * @param {Number} transactionFee: transactionFee of the producer
 * @param {Object} optional: optional fields for both the producer/merchant under respective keys
 * @returns {Promise} resulting producer object
 */
export async function create(name, password, description, percentageFee, transactionFee, optional = {}) {
  const producer = await _create(name, password, description, optional.producer);
  producer.merchant = await Merchant.create(percentageFee, transactionFee, optional.merchant);
  return await producer.save();
}

/**
 * Find and update a producer from their facebook id with specified fields
 *
 * @param {String} _id: producer's _id
 * @param {Object} fields: key/value pairs with updated fields
 * @returns {Promise} returns the producer without updates from the database
 */
export async function updateByObjectId(_id, fields) {
  return await Producer.findOneAndUpdate({_id}, {$set: fields}, {runValidators: true});
}
