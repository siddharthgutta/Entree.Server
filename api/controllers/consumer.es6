/**
 * Created by kfu on 6/22/16.
 */

import * as Consumer from '../db/consumer.es6';
import * as Location from './location.es6';
import * as Producer from './producer.es6';
import * as Context from '../db/context.es6';
import * as Utils from '../../libs/utils.es6';
import * as Distance from '../../libs/location/distance.es6';
import _ from 'lodash';

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

export async function _findOne(fbId, populateFields = []) {
  return await Consumer.findOne(fbId, populateFields);
}

/**
 * Finds a user by their fbId
 *
 * @param {String} fbId: the facebook id of the consumer
 * @returns {Query|Promise|*} return the consumer from the database
 */
export async function findOneByFbId(fbId) {
  return await _findOne({fbId}, ['context', 'defaultLocation']);
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
 * Adds a default location to the consumer if it exists, otherwise, changes default location
 * and pushes previous default location to the location array
 *
 * @param {String} fbId: facebook id of the consumer
 * @param {Number} lat: the latitude of the location to be added
 * @param {Number} long: the longitude of the location to be added
 * @returns {Location} the updated location
 */
export async function addLocation(fbId, lat, long) {
  const consumer = await findOneByFbId(fbId);
  const location = await Location.createWithCoord(lat, long);
  if (!Utils.isEmpty(consumer.defaultLocation)) {
    consumer.location.push(consumer.defaultLocation);
  }
  consumer.defaultLocation = location._id;
  return await consumer.save();
}

/**
 * Finds the distance from a given location of a consumer using fbId and default location
 *
 * @param {String} fbId: facebook id of the consumer
 * @param {[Producer]} producers: the producers whose location we are comparing with
 * @returns {Object} the distances in miles with key-value pairs with the locations as keys and distances as values
 */
export async function findDistanceFromLocations(fbId, producers) {
  const consumer = await findOneByFbId(fbId);
  if (Utils.isEmpty(consumer.defaultLocation)) throw new Error('Invalid Location');
  const consumerLat = consumer.defaultLocation.coordinates.latitude;
  const consumerLong = consumer.defaultLocation.coordinates.longitude;
  const distances = {};
  const obj2 = {};

  _(producers).forEach(producer => {
    obj2[producer._id.toString()] = producer.location.coordinates;
  });

  _(producers).forEach(producer => {
    if (Utils.isEmpty(producer.location)) throw new Error('Invalid Location');
    const producerLat = producer.location.coordinates.latitude;
    const producerLong = producer.location.coordinates.longitude;
    distances[producer.location] = Distance.calcDistanceInMiles(consumerLat, consumerLong, producerLat, producerLong);
  });
  return distances;
}

/**
 * Helper function to the JavaScript sort function to sort array by distances
 *
 * @param {Object} a: Producer object with a distance field
 * @param {Object} b: Producer object with a distance field
 * @returns {number} the distance element of "a" relative to "b"
 * @private
 */
function _compare(a, b) {
  if (a.distance < b.distance) return -1;
  if (a.distance > b.distance) return 1;
  return 0;
}

/**
 * Gets the closest producers to the consumer within a given radius and limit of producers
 * and sorts them by distance from the consumer
 *
 * @param {String} fbId: facebook id of the consumer
 * @param {number} radius: the radius in miles to search for producers across
 * @param {number} limit: number of results desired
 * @returns {Array<Location>} closest producers within the specified radius
 */
export async function getClosestEnabledProducers(fbId, radius, limit) {
  const enabled = await Producer.findFbEnabled();
  const closest = [];
  let k = 0;
  const locationDists = await findDistanceFromLocations(fbId, enabled);
  _(locationDists).forEach(dist => {
    if (dist < radius) {
      enabled[k].distance = dist;
      closest.push(enabled[k]);
    }
    k++;
  });
  closest.sort(_compare);
  return closest.slice(0, limit);
}
