/**
 * Created by kfu on 6/24/16.
 */

import * as Merchant from '../db/merchant.es6';

/**
 * Finds a user by their merchantId
 *
 * @param {String} merchantId: the facebook id of the consumer
 * @returns {Query|Promise|*} return the merchant from the database
 */
export async function findOneByMerchantId(merchantId) {
  return await Merchant.findOne({merchantId});
}

/**
 * Finds a merchant by their object id
 *
 * @param {ObjectId} _id: the object id of the merchant
 * @returns {Promise}: return the merchant from the database
 */
export async function findOneByObjectId(_id) {
  return await Merchant.findOne({_id});
}

/**
 * Sets the merchantId of a merchant object
 *
 * @param {ObjectId} _id: object id of the merchant object
 * @param {String} merchantId: merchantId of the merchant object
 * @returns {Promise}: merchant object without the updates
 */
export async function setMerchantId(_id, merchantId) {
  return await Merchant.findOneAndUpdate({_id}, {$set: {merchantId}}, {runValidators: true});
}

/**
 * Create a merchant from their percentageFee and transactionFee
 *
 * @param {Number} percentageFee: merchant's percentage fee (integer) integer %
 * @param {Number} transactionFee: merchant's transaction fee (integer) integer cents
 * @returns {Promise} returns the merchant from the database
 */
export async function create(percentageFee, transactionFee, optional = {}) {
  return await Merchant.create({percentageFee, transactionFee, ...optional});
}

/**
 * Calculate service fee for a merchant
 *
 * @param {Number} orderTotal: total cost of the order in cents (integer)
 * @param {Number} percentageFee: merchant's percentage fee (integer) integer %
 * @param {Number} perTransactionFee: merchant's transaction fee (integer) integer cents
 * @returns {number} returns the total service fee for an order
 */
export function calculateServiceFee(orderTotal, percentageFee, perTransactionFee) {
  return Math.round(orderTotal * percentageFee / 100 + perTransactionFee);
}
