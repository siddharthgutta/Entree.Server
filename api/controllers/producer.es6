/**
 * Created by kfu on 6/22/16.
 */

import * as Producer from '../db/producer.es6';
import * as Merchant from '../controllers/merchant.es6';
import _ from 'lodash';
import * as Location from '../controllers/location.es6';

/**
 * Find the producer from its object id
 *
 * @param {ObjectId} _id: object id of the producer object
 * @returns {Promise<Producer>}: the producer with the specific id
 */
export async function findOneByObjectId(_id) {
  return await Producer.findOne({_id}, ['merchant', 'location']);
}

/**
 * Find the producer from its username
 *
 * @param {String} username: username of the producer object
 * @returns {Promise<Producer>}: the producer with the specific username
 */
export async function findOneByUsername(username) {
  return await Producer.findOne({username}, ['merchant']);
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
 * Find enabled producers with given conditions
 *
 * @param {Object} conditions: key value pairs of the conditions we want to query by
 * @returns {Promise}: returns the producers found
 */

export async function findFbEnabled(conditions = {}) {
  return await _find(_.merge(conditions, {enabled: true}), 10, {createdAt: 'descending'}, ['merchant', 'location']);
}

/**
 * Finds all enabled producers with the given conditions
 *
 * @param {Object} conditions: key value pairs of the conditions we want to query by
 * @returns {Promise}: returns the producers found
 */
export async function findAllEnabled(conditions = {}) {
  return await _find(_.merge(conditions, {enabled: true}), 0, {createdAt: 'descending'}, ['merchant', 'location']);
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
 * @param {Location} location: the location object specifying the location of the producer
 * @param {Number} percentageFee: percentage fee of the merchant
 * @param {Number} transactionFee: transaction fee of the merchant
 * @param {String} menuLink: link to the producer's menu
 * @param {Object} optional: optional fields for the producer
 * @returns {Promise<Producer>}: resulting producer object
 */

export async function _create(name, username, password, description, profileImage, exampleOrder,
                              location, percentageFee, transactionFee, menuLink, optional = {}) {
  const merchant = await Merchant.create(percentageFee, transactionFee, optional.merchant);
  return await Producer.create({name, username, password, description, profileImage, exampleOrder,
    location: location._id, merchant: merchant._id, menuLink, ...optional.producer});
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
 * @param {String} address: address of the producer's location
 * @param {Number} percentageFee: percentageFee of the producer
 * @param {Number} transactionFee: transactionFee of the producer
 * @param {String} menuLink: the link to the menu of the producer
 * @param {Object} optional: optional fields for both the producer/merchant under respective keys
 * @returns {Promise} resulting producer object
 */

export async function create(name, username, password, description, profileImage, exampleOrder, address,
                             percentageFee, transactionFee, menuLink, optional = {}) {
  const location = await Location.createWithAddress(address);
  const producer = await _create(name, username, password, description, profileImage,
    exampleOrder, location, percentageFee, transactionFee, menuLink, optional);
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
