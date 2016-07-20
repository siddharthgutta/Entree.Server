/**
 * Created by kfu on 6/27/16.
 */

import * as Order from '../db/order.es6';
import * as Producer from './producer.es6';

/**
 * Find the order from its object id
 *
 * @param {ObjectId} _id: object id of the order object
 * @returns {Promise<Order>}: the order with the specific id
 */
export async function findOneByObjectId(_id) {
  return await Order.findOne({_id});
}

/**
 * Returns a Query object for finding orders
 *
 * @param {Object} conditions: key value pairs of the conditions we want to query by
 * @param {Number} limit: number of objects to limit the query to find
 * @param {Array<String>} populateFields: fields to populate query with
 * @param {Object} sortFields: key value pairs of the fields to sort on Ex: {createdAt: 'descending'}
 * @returns {Promise}: returns the orders found
 */
export async function _find(conditions, limit, sortFields = {}, populateFields = []) {
  return await Order.find(conditions, limit, sortFields, populateFields);
}

/**
 * Find by order objects by producer, status, and limit
 *
 * @param {ObjectId} producerId: producer id for the order
 * @param {String} status: status for the order
 * @param {Number} limit: number of objects to limit the query to find
 * @returns {Promise}: returns the orders found
 */
export async function findByStatusForProducer(producerId, status, limit) {
  const {orders} = await Producer.findOneByObjectId(producerId);
  return await _find({_id: {$in: orders}, status}, limit, {createdAt: 'ascending'});
}

/**
 * Create a order in the database
 *
 * @param {String} body: text body of the order
 * @param {String} producer: producer id for the order
 * @param {String} consumer: consumer id for the order
 * @param {Object} optional: optional fields for the order
 * @returns {Promise<Order>}: the order that was just created
 */
export async function create(body, producer, consumer, optional = {}) {
  return await Order.create({body, producer, consumer, ...optional});
}

/**
 * Find and update a order from their facebook id with specified fields
 *
 * @param {String} _id: order's _id
 * @param {Object} fields: key/value pairs with updated fields
 * @returns {Promise} returns the order without updates from the database
 */
export async function updateByObjectId(_id, fields) {
  return await Order.findOneAndUpdate({_id}, {$set: fields}, {runValidators: true});
}

/**
 * Pushes order to orders of a parent object by order id
 *
 * @param {Array<Consumer|Producer>} parentObjects: object to push the order to (consumer|producer)
 * @param {ObjectId} orderId: id of the order being pushed
 * @returns {Promise} parentObject (consumer | producer)
 */
export async function pushOrderByObjectId(parentObjects, orderId) {
  for (const parentObject of parentObjects) {
    await Order.pushSubObjectByObjectId(parentObject, 'orders', orderId);
  }
}
