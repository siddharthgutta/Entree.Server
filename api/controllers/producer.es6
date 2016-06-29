/**
 * Created by kfu on 6/22/16.
 */

import * as Producer from '../db/producer.es6';
import * as Merchant from '../controllers/merchant.es6';
import _ from 'lodash';

/**
 * Find the producer from its object id
 *
 * @param {ObjectId} _id: object id of the producer object
 * @returns {Promise<Producer>}: the producer with the specific id
 */
export async function findOneByObjectId(_id) {
  return await Producer.findOne({_id}, ['merchant']);
}

/**
 * Returns a Query object for finding producers
 *
 * @param {Object} conditions: key value pairs of the conditions we want to query by
 * @param {Number} limit: number of objects to limit the query to find
 * @param {Object} sortFields: key value pairs of the fields to sort on Ex: {createdAt: 'descending'}
 * @param {Array<String>} populateFields: fields to populate query with
 * @returns {Promise}: returns the producers found
 */
export async function _find(conditions, limit, sortFields = {}, populateFields = []) {
  return await Producer.find(conditions, limit, sortFields, populateFields);
}

/**
 * Find enabled producers
 *
 * @param {Number} conditions: size of random sample of producers to find
 * @returns {Promise}: returns the producers found
 */
export async function findFbEnabled(conditions = {}) {
  return await _find(_.merge(conditions, {enabled: true}), 10, {createdAt: 'descending'}, ['merchant']);
}

/**
 * Create a producer in the database
 *
 * @param {String} name: name of the producer
 * @param {String} username: username for the producer
 * @param {String} password: password for the producer
 * @param {String} description: description of the producer
 * @param {String} profileImage: profileImage of the producer
 * @param {String} exampleOrder: exampleOrder of the producer
 * @param {Object} optional: optional fields for the producer
 * @returns {Promise<Producer>}: the producer that was just created
 */
export async function _create(name, username, password, description, profileImage, exampleOrder, optional = {}) {
  return await Producer.create({name, username, password, description, profileImage, exampleOrder, ...optional});
}

/**
 * Creates a producer as a merchant
 *
 * @param {String} name: name of the producer
 * @param {String} username: username for the producer
 * @param {String} password: password of the producer
 * @param {String} description: description of the producer
 * @param {String} profileImage: profileImage of the producer
 * @param {String} exampleOrder: exampleOrder of the producer
 * @param {Number} percentageFee: percentageFee of the producer
 * @param {Number} transactionFee: transactionFee of the producer
 * @param {Object} optional: optional fields for both the producer/merchant under respective keys
 * @returns {Promise} resulting producer object
 */
export async function create(name, username, password, description,
                             profileImage, exampleOrder, percentageFee, transactionFee, optional = {}) {
  const producer = await _create(name, username, password, description, profileImage, exampleOrder, optional.producer);
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
