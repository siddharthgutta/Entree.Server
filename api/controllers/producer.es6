/**
 * Created by kfu on 6/22/16.
 */

import * as Producer from '../db/producer.es6';
import * as Merchant from '../controllers/merchant.es6';
import _ from 'lodash';
import * as Hour from './hour.es6';

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

/**
 * Adds hours to the producer object and stores in a subdoc
 *
 * @param {String} day: the day to add
 * @param {String} open: the opening time should be 'hh:mm a'
 * @param {String} close: the closing time should be 'hh:mm a'
 * @param {String} id: unique identifier to find the producer
 * @returns {Promise} the result of the update
 */
export async function addHour(day, open, close, id) {
  const hour = await Hour.create(day, open, close);
  const prod = await findOneByObjectId(id);
  prod.hours.push(hour);
  return await prod.save();
}

/**
 * Adds multiple times with an array of hours to a specific producer
 *
 * @param {String} id: unique identifier to find the producer
 * @param {Array} array: array of hour objects
 * @return {Promise} returns the updated producer
 */
export async function addHours(id, array) {
  const prod = await Producer.findOne(id);
  _.forEach(array, async function(key) {
    prod.hours.push(key);
  });
  return await prod.save();
}
/**
 * Deletes a specific hour object for a specific producer
 * @param {String} id: unique identifier to find the producer
 * @param {String} hourId: the id of the hour to delete
 * @returns {Promise} removed object
 */
export async function deleteHour(id, hourId) {
  const prod = await Producer.findOne(id);
  _.forEachRight(prod.hours, key => {
    if (key._id.equals(hourId)) {
      key.remove();
    }
  });
  return await prod.save();
}

/**
 * Deletes all hours for a day for a specific producer
 *
 * @param {String} id: unique identifier to find the producer
 * @param {String} day: the day to delete from the producers
 * @returns {Promise} : return the new producer after the hours are deleted
 */
export async function deleteDay(id, day) {
  const prod = await Producer.findOne(id);
  _.forEachRight(prod.hours, key => {
    if (key.day === day) {
      key.remove();
    }
  });
  return await prod.save();
}

/**
 * Gets the hours for a specific producer
 *
 * @param {number} id: finds the producer
 * @returns {Promise} the array of hour objects of the restaurant's hours
 */
export async function getHours(id) {
  return (await Producer.findOne(id)).hours;
}

/**
 * Gets the servers current time
 *
 * @returns {String} the current time in 'HHmm'
 */
export function getCurrentTime() {
  const date = new Date();
  return `${date.getHours()}:${date.getMinutes()}`;
}
