/**
 * Created by kfu on 6/22/16.
 */

import * as Producer from '../db/producer.es6';
import * as Merchant from '../controllers/merchant.es6';
import _ from 'lodash';
import * as Location from '../controllers/location.es6';
import Moment from 'moment';

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
  return await Producer.findOne({username}, ['merchant', 'location']);
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
  let updatedFields = fields;
  if ('address' in updatedFields) {
    const location = await Location.createWithAddress(updatedFields.address);
    updatedFields = _.merge(_.omit('address'), {location});
  }
  return await Producer.findOneAndUpdate({_id}, {$set: updatedFields}, {runValidators: true});
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
  _.forEach(array, async key => {
    prod.hours.push(key);
  });
  return await prod.save();
}
/**
 * Deletes specific hour objects for a specific producer
 * @param {String} id: unique identifier to find the producer
 * @param {Array} hourIds: the id of the hour to delete
 * @returns {Promise} removed object
 */
export async function deleteHours(id, hourIds) {
  const prod = await Producer.findOne(id);
  _.forEachRight(prod.hours, time => {
    _.forEach(hourIds, hourId => {
      if (time._id.equals(hourId)) {
        time.remove();
      }
    });
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
  _.forEachRight(prod.hours, time => {
    if (time.day === day) {
      time.remove();
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
  return new Moment('HH:mm');
}
/**
 * Gives the user the day of the week it is
 *
 * @returns {String} the day of the week it is (ie 'Monday')
 */
export function dayOfWeek() {
  return new Moment().format('dddd');
}

/**
 *
 * @param {Moment} time: the time to check as a number
 * @param {String} dayWeek: the day of the week to check
 * @returns {Array} an array of producers that are open based on the parameters
 */
export async function findOpenHelper(time, dayWeek) {
  const prodArr = [];
  const prodEnabled = await findAllEnabled();
  _.forEach(prodEnabled, prod => {
    _.forEach(prod.hours, hour => {
      const open = new Moment(hour.openTime, 'HH:mm');
      const close = new Moment(hour.closeTime, 'HH:mm');
      if (hour.day === dayWeek &&
        (time.isAfter(open) && time.isBefore(close))) {
        prodArr.push(prod);
        return false;
      }
    });
  });
  return prodArr;
}

/**
 * Gives the user the producers that are currently open
 *
 * @returns {Array} an array of producers that are open
 */
export async function findOpen() {
  const time = getCurrentTime();
  const dayWeek = dayOfWeek();
  return findOpenHelper(time, dayWeek);
}
