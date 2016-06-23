/**
 * Created by kfu on 6/22/16.
 */

import * as Consumer from '../db/consumer.es6';

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
 * Create a consumer from their facebook id and their profile information
 *
 * @param {String} fbId: consumer's fbId
 * @param {String} firstName: consumer's first name
 * @param {String} lastName: consumer's last name
 * @returns {Consumer} returns the consumer from the database
 */
export async function createFbConsumer(fbId, firstName, lastName) {
  return await Consumer.create(fbId, firstName, lastName);
}

/**
 * Increments the receipt counter for a consumer with a specific fbId
 *
 * @param {String} fbId: facebook id of the consumer
 * @returns {Consumer} consumer that was updated
 */
export async function incrementReceiptCounter(fbId) {
  return await Consumer.update({fbId}, {$inc: {receiptCount: 1}});
}
