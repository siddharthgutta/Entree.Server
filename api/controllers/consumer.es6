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

/**
 * Finds one consumer by fields
 * @param {Object} fields: input fields/conditions to find a consumer by
 * @param {Object} populateFields: list of fields to populate
 * @returns {Promise}: Consumer object if found
 * @private
 */
export async function findOneByFields(fields, populateFields = []) {
  return await Consumer.findOne(fields, populateFields);
}

/**
 * Find and update a consumer from their facebook id with specified fields
 *
 * @param {String} _id: consumer's _id
 * @param {Object} fields: key/value pairs with updated fields
 * @returns {Promise} returns the producer without updates from the database
 */
export async function updateByObjectId(_id, fields) {
  return await Consumer.findOneAndUpdate({_id}, {$set: fields}, {runValidators: true, new: true});
}

/**
 * Finds a user by their fbId
 *
 * @param {String} fbId: the facebook id of the consumer
 * @returns {Query|Promise|*} return the consumer from the database
 */
export async function findOneByFbId(fbId) {
  return await findOneByFields({fbId}, ['context', 'defaultLocation']);
}

/**
 * Finds a user by their _id
 *
 * @param {String} _id: the facebook id of the consumer
 * @returns {Query|Promise|*} return the consumer from the database
 */
export async function findOneByObjectId(_id) {
  return await findOneByFields({_id}, ['context', 'defaultLocation']);
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
export async function updateFieldsByFbId(fbId, fields) {
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
 * and returns an array specifying the distance from each given producer
 *
 * @param {String} fbId: facebook id of the consumer
 * @param {Array<Producer>} producers: the producers whose location we are comparing with; can also be an object
<<<<<<< 0fd83d107b535809bf5785635f253af4a804ec64
 * @returns {Array<Producer>} an array of producers with an additional field specifying distance as _distance
 */
export async function findDistanceFromProducerCoordinates(fbId, producers) {
  const consumer = await findOneByFbId(fbId);
  if (Utils.isEmpty(consumer.defaultLocation)) throw new Error('Invalid Location');
  const distances = [];
  const obj = {};
  const idsToProducers = {};
  _(producers).forEach(producer => {
    obj[producer._id] = producer.location.coordinates;
  });
  _(producers).forEach(producer => {
    idsToProducers[producer._id] = producer;
  });

  const results = Distance.orderByDistance(consumer.defaultLocation.coordinates, obj);
  _(results).forEach(value => {
    const producerWithDistance = idsToProducers[value.key];
    producerWithDistance._distance = value.distance;
    distances.push(producerWithDistance);
  });
  return distances;
}

/**
 * Gets the closest producers to the consumer within a given radius and limit of producers
 * and sorts them by distance from the consumer (using the geolib orderByDistance method)
 *
 * @param {String} fbId: facebook id of the consumer
 * @param {number} radius: the radius in miles to search for producers across
 * @param {number} limit: number of results desired
 * @returns {Array<Producer>} closest producers within the specified radius with each producer along with a distance
 * field as _distance
 */
export async function getClosestEnabledProducers(fbId, radius, limit) {
  const enabled = await Producer.findAllEnabled();
  const closest = [];
  const producerDists = await findDistanceFromProducerCoordinates(fbId, enabled);

  _(producerDists).forEach(producer => {
    if (producer._distance < radius && Producer.isOpen(producer.hours)) {
      closest.push(producer);
    }
  });
  return closest.slice(0, limit);
}
/**
 *  Returns 10 producers in a list
 *
 * @param {Array} prods: producers list to pull from
 * @returns {Array} an array of ten producers
 */
function fillTenProducers(prods) {
  const prodList = [];
  let k = 0;
  while (k < prods.length && prodList.length < 10) {
    prodList.push(prods[k]);
    k++;
  }
  return prodList;
}

/**
 * Finds producers open for a consumer based off of distance and if they are open
 *
 * @param {String} fbId: facebook id of the consumer
 * @param {number} dist: the base search radii
 * @param {number} multiplier: the multiplier for the range
 * @param {Moment} time: the time to check with
 * @param {String} dayOfWeek: the day of the week to check with
 * @returns {Array} an array of producers based on the distance and if they are open
 */
export async function concentricCircleHelper(fbId, dist, multiplier, time, dayOfWeek) {
  const openArr = [];
  const closeArr = [];
  const prodList = [];
  let range = dist;
  const prods = await Producer.findAllEnabled();
  for (const prod of prods) {
    if (Producer.isOpenHelper(time, dayOfWeek, prod.hours)) openArr.push(prod);
    else closeArr.push(prod);
  }
  const openProds = await findDistanceFromProducerCoordinates(fbId, openArr);
  const closeProds = await findDistanceFromProducerCoordinates(fbId, closeArr);
  if (openProds.length === 0) return fillTenProducers(closeProds);
  if (closeProds.length === 0) return fillTenProducers(openProds);
  let openIndex = 0;
  let closeIndex = 0;
  while (prodList.length < 10 && (openIndex < openProds.length || closeIndex < closeProds.length)) {
    while (openIndex < openProds.length && openProds[openIndex]._distance < range && prodList.length < 10) {
      prodList.push(openProds[openIndex++]);
    }
    while (closeIndex < closeProds.length && closeProds[closeIndex]._distance < range && prodList.length < 10) {
      prodList.push(closeProds[closeIndex++]);
    }
    range *= multiplier;
  }
  return prodList;
}
/**
 * Finds producers open for a consumer based off of distance and if they are open
 *
 * @param {String} fbId: facebook id of the consumer
 * @param {number} dist: the base search radii
 * @param {number} multiplier: the multiplier for the range
 * @returns {Array} an array of producers based on the distance and if they are open
 */
export async function concentricCircle(fbId, dist, multiplier) {
  return concentricCircleHelper(fbId, dist, multiplier, Producer.getCurrentTime(),
  Producer.dayOfWeek());
}
