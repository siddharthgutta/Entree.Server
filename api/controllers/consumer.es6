/**
 * Created by kfu on 6/22/16.
 */

import * as Consumer from '../db/consumer.es6';
import * as LocationAPI from './location.es6';
import * as ProducerAPI from './producer.es6';
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

/**
 * Adds a location to the given consumer object
 *
 * @param {String} fbId: facebook id of the consumer
 * @param {Number} lat: the latitude of the location to be added
 * @param {Number} long: the longitude of the location to be added
 * @returns {Location} the updated location
 */
export async function addLocation(fbId, lat, long) {
  const consumer = await findOneByFbId(fbId);
  const location = await LocationAPI.createWithCoord(lat, long);
  if (location && consumer.defaultLocation) {
    consumer.location.push(consumer.defaultLocation);
    consumer.defaultLocation = location._id;
  }
  if (location) {
    consumer.defaultLocation = location._id;
  }
  return await consumer.save();
}

/**
 * Finds the distance from a given location of a consumer using fbId and default location
 *
 * @param {String} fbId: facebook id of the consumer
 * @param {Number} lat: the latitude of the location to be added
 * @param {Number} long: the longitude of the location to be added
 * @returns {Number} the distance in miles from the consumer's location to the given location
 */
export async function findDistanceFromLocation(fbId, lat, long) {
  const consumer = await findOneByFbId(fbId);
  const location = await LocationAPI.createWithCoord(lat, long);
  return LocationAPI.findDistanceInMiles(consumer.defaultLocation, location);
}

/**
 * Gets the closest producers to the consumer within a given radius and limit of producers
 *
 * @param {String} fbId: facebook id of the consumer
 * @param {number} radius: the radius in miles to search for producers across
 * @param {number} limit: number of results desired
 * @returns {Array<Location>} closest producers within the specified radius
 */
export async function getClosestProducers(fbId, radius, limit) {
  const enabled = await ProducerAPI.findFbEnabled();
  const closest = [];
  for (let k = 0; k < enabled.length; k++) {
    if (await findDistanceFromLocation(fbId, enabled[k].location.coordinates.latitude,
        enabled[k].location.coordinates.longitude) < radius) {
      closest.push(enabled[k]);
    }
  }
  return closest.slice(0, limit);
}
