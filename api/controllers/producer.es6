/**
 * Created by kfu on 6/22/16.
 */

import * as Producer from '../db/producer.es6';
import * as Merchant from '../controllers/merchant.es6';
import _ from 'lodash';
import * as Location from '../controllers/location.es6';
import * as User from '../controllers/user.es6';
import moment from 'moment';
import * as Context from '../controllers/context.es6';

/**
 * Finds a producer by the FbId
 *
 * @param {String} fbId: facebook messenger id of the producer
 * @returns {Promise<Producer>}: the producer with the specific fbId
 */
export async function findOneByFbId(fbId) {
  return await Producer.findOne({fbId}, ['context', 'merchant', 'location']);
}


/**
 * Find the producer from its object id
 *
 * @param {ObjectId} _id: object id of the producer object
 * @returns {Promise<Producer>}: the producer with the specific id
 */
export async function findOneByObjectId(_id) {
  return await Producer.findOne({_id}, ['merchant', 'location', 'user']);
}

/**
 * Find the producer from its username
 *
 * @param {String} username: username of the producer object
 * @returns {Promise<Producer>}: the producer with the specific username
 */
export async function findOneByUsername(username) {
  const {_id} = await User.findByUsername(username);
  return await Producer.findOne({user: _id}, ['merchant', 'location', 'user']);
}

// Temporary function while migration is occurring
export async function findOneByUsernameField(username) {
  return await Producer.findOne({username}, ['merchant', 'location', 'user']);
}

/**
 * Returns a Query object for finding producers
 *
 * @param {Object} conditions: key value pairs of the conditions we want to query by
 * @param {Number} limit: number of objects to limit the query to find
 * @param {Object} sortFields: key value pairs of the fields to sort on Ex: {createdAt: 'descending'}
 * @param {Array<String>} populateFields: fields to populate query with
 * @returns {Promise}: returns the producers found
 * @private
 */
export async function _find(conditions, limit, sortFields = {}, populateFields = []) {
  return await Producer.find(conditions, limit, sortFields, populateFields);
}

/**
 * Returns producers using the mongoose aggregate function
 *
 * @param {Object} conditions: key value pairs of the conditions we want to query by
 * @param {Number} limit: number of objects to limit the query to find
 * @param {Object} sortFields: key value pairs of the fields to sort on Ex: {createdAt: 'descending'}
 * @returns {Promise}: returns the producers found
 * @private
 */
export async function _findWithAggregate(conditions, limit, sortFields = {}) {
  return await Producer.findWithAggregate(conditions, limit, sortFields);
}

/**
 * Finds all producers
 *
 * @param {Object} conditions: key value pairs of the conditions we want to query by
 * @returns {Promise}: returns the producers found
 */
export async function findAll(conditions = {}) {
  return await _find(conditions, 0, {createdAt: 'descending'}, ['merchant', 'location']);
}

/**
 * Find enabled producers with given conditions
 *
 * @param {Object} conditions: key value pairs of the conditions we want to query by
 * @returns {Promise}: returns the producers found
 */

export async function findFbEnabled(conditions = {}) {
  return await _find(_.merge(conditions, {enabled: true}), 10, {createdAt: 'descending'},
    ['merchant', 'location', 'user']);
}

/**
 * Finds all enabled producers with the given conditions
 *
 * @param {Object} conditions: key value pairs of the conditions we want to query by
 * @returns {Promise}: returns the producers found
 */
export async function findAllEnabled(conditions = {}) {
  return await findAll(_.merge(conditions, {enabled: true}));
}

/**
 * Finds random enabled producers with the given conditions
 *
 * @param {Object} conditions: key value pairs of the conditions we want to query by
 * @param {Number} limit: number of things to find
 * @returns {Promise}: returns the producers found
 */
export async function findRandomEnabled(conditions = {}, limit = 10) {
  return await _findWithAggregate(_.merge(conditions, {enabled: true}), limit, {createdAt: 'descending'});
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
 * @param {Object} optional: optional fields for the producer
 * @returns {Promise<Producer>}: resulting producer object
 */

export async function _create(name, username, password, description, profileImage, exampleOrder,
                              location, percentageFee, transactionFee, optional = {}) {
  const merchant = await Merchant.create(percentageFee, transactionFee, optional.merchant);
  const context = await Context.create({...(optional.context)});
  const {_id: user} = await User.create(username, password);
  return await Producer.create({name, user, description, profileImage, exampleOrder,
    location: location._id, merchant: merchant._id, context, ...optional.producer});
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
 * @param {Object} optional: optional fields for both the producer/merchant under respective keys
 * @returns {Promise} resulting producer object
 */

export async function create(name, username, password, description, profileImage, exampleOrder, address,
                             percentageFee, transactionFee, optional = {}) {
  const location = await Location.createWithAddress(address);
  const producer = await _create(name, username, password, description, profileImage,
    exampleOrder, location, percentageFee, transactionFee, optional);
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
    updatedFields = _.merge(_.omit(updatedFields, 'address'), {location});
  }
  return await Producer.findOneAndUpdate({_id}, {$set: updatedFields}, {runValidators: true, new: true});
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
 * Removes all hours for a producer
 * @param {String} id: unique identifier for a specific producer
 * @returns {Promise} the updated producer object
 */
export async function deleteAllHours(id) {
  const prod = await Producer.findOne(id);
  _.forEachRight(prod.hours, hour => {
    hour.remove();
  });
  return await prod.save();
}

/**
 * Deletes specific hour objects for a specific producer
 * @param {String} id: unique identifier to find the producer
 * @param {Array} hourIds: the id of the hour to delete
 * @returns {Promise} the new producer without hours
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
 * Deletes all hours for a day for a producer
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
 * @returns {Moment} the current time
 */
export function getCurrentTime() {
  return moment();
}

/**
 * Gives the user the day of the week it is
 *
 * @returns {String} the day of the week it is (ie 'Monday')
 */
export function dayOfWeek() {
  return moment().format('dddd');
}

/**
 *
 * @param {Moment} time: the time to check as a number
 * @param {String} dayOfTheWeek: the day of the week to check
 * @returns {Array} an array of producers that are open based on the parameters
 */
export async function findOpenHelper(time, dayOfTheWeek) {
  const prodArr = [];
  const prodEnabled = await findAllEnabled();
  _.forEach(prodEnabled, prod => {
    _.forEach(prod.hours, hour => {
      const open = moment(hour.openTime, 'HH:mm');
      const close = moment(hour.closeTime, 'HH:mm');
      if (hour.day === dayOfTheWeek && (time.isAfter(open) && time.isBefore(close))) {
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
  return findOpenHelper(getCurrentTime(), dayOfWeek());
}

/**
 * Helper function for the isOpen function
 *
 * @param {Moment} time: the time to check as a number
 * @param {String} dayOfTheWeek: the day of the week to check
 * @param {Array<hour>} hours: the hours to check
 * @returns {boolean} whether or not the hours correspond to being open
 */
export function isOpenHelper(time, dayOfTheWeek, hours) {
  for (const hour of hours) {
    const open = moment(hour.openTime, 'HH:mm');
    const close = moment(hour.closeTime, 'HH:mm');
    if (hour.day === dayOfTheWeek && (time.isAfter(open) && time.isBefore(close))) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if the given hours correspond to being open or not
 *
 * @param {Array<hour>} hours: the hours to check
 * @returns {boolean} whether or not the hours correspond to being open
 */
export function isOpen(hours) {
  return isOpenHelper(getCurrentTime(), dayOfWeek(), hours);
}
