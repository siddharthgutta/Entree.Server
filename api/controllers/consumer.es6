/**
 * Created by kfu on 6/22/16.
 */

import * as Consumer from '../db/consumer.es6';
import * as Context from '../db/context.es6';

/**
 * Creates a basic consumer with a contextId
 *
 * @param {ObjectId} contextId: object id of the context of the created consumer
 * @param {Object} optional: optional fields for the created consumer
 * @returns {Promise} returns the consumer from the database
 * @private
 */
export async function _create(contextId, optional = {}) {
  return await Consumer.create({context: contextId, ...optional});
}

/**
 * Finds a user by their fbId
 *
 * @param {String} fbId: the facebook id of the consumer
 * @returns {Query|Promise|*} return the consumer from the database
 */
export async function findOneByFbId(fbId) {
  return await Consumer.findOne({fbId});
}

/**
 * Create a facebook consumer from their facebook id and their profile information
 *
 * @param {String} fbId: consumer's fbId
 * @param {Object} optional: optional fields for both the consumer/context under respective keys
 * @returns {Promise<Consumer>} returns the consumer from the database
 */
export async function createFbConsumer(fbId, optional = {}) {
  const {_id: contextId} = await Context.create({...(optional.context)});
  return await _create(contextId, {fbId, ...(optional.consumer)});
}

/**
 * Find and upate a consumer from their facebook id with specified fields
 *
 * @param {String} fbId: consumer's fbId
 * @param {Object} fields: key/value pairs with updated fields
 * @returns {Consumer} returns the consumer without updates from the database
 */
export async function setFieldsByFbId(fbId, fields) {
  return await Consumer.findOneAndUpdate({fbId}, {$set: fields}, {runValidators: true});
}

/**
 * Increments the receipt counter for a consumer with a specific fbId
 *
 * @param {String} fbId: facebook id of the consumer
 * @returns {Consumer} consumer that was updated
 */
export async function incrementReceiptCounterByFbId(fbId) {
  return await Consumer.findOneAndUpdate({fbId}, {$inc: {receiptCount: 1}}, {runValidators: true});
}
