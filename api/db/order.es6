/**
 * Created by kfu on 6/27/16.
 */

import models from '../../models/mongo/index.es6';
import * as Utils from '../../libs/utils.es6';
import _ from 'lodash';

const Order = models.Order;

/**
 * IMPORTANT: Must return promises!
 */

/**
 * Creates a order
 *
 * @param {Object} attributes: key value pairs of the attributes we want to populate the Order with
 * @returns {Promise}: returns a Order object
 */
export async function create(attributes) {
  return await (new Order(attributes)).save();
}

/**
 * Returns a single order given a query
 *
 * @param {Object} attributes: key value pairs of the attributes we want to query by
 * @returns {Promise}: returns a Order object
 */
export async function findOne(attributes) {
  const order = await Order.findOne(attributes).exec();
  if (Utils.isEmpty(order)) {
    throw new Error(`Could not find order with attributes: ${JSON.stringify(attributes)}`);
  }
  return order;
}

/**
 * Returns a Query object for finding orders
 *
 * @param {Object} conditions: key value pairs of the conditions we want to query by
 * @param {Number} limit: number of objects to limit the query to find
 * @param {Object} sortFields: key value pairs of the fields to sort on Ex: {createdAt: 'descending'}
 * @param {Array<String>} populateFields: fields to populate query with
 * @returns {Promise}: returns the orders found
 */
export async function find(conditions, limit, sortFields, populateFields) {
  let findQuery = Order.find(conditions);
  findQuery = _.reduce(populateFields, (query, field) =>
      findQuery.populate(field),
    findQuery);
  return await findQuery.limit(limit).sort(sortFields).exec();
}

/**
 * Find one order and update it
 *
 * @param {Object} conditions: conditions to query on
 * @param {Object} updates: updates to apply to the order
 * @param {Object} options: options to modify the query
 * @returns {Promise}: returns the Order object
 */
export async function findOneAndUpdate(conditions, updates, options = null) {
  const order = await Order.findOneAndUpdate(conditions, updates, options).exec();
  if (Utils.isEmpty(order)) {
    throw new Error(`Could not find and update order with attributes: ${conditions} with updates ${updates}`);
  }
  return order;
}

/**
 * Push an order to a parent (consumer/producer object) with the sub object id
 *
 * @param {Consumer|Producer} parentObject: object to push the sub object to (consumer|producer)
 * @param {String} field: field of parent to push to
 * @param {ObjectId} subObjectId: id of the object being pushed
 * @returns {Promise} parentObject (consumer | producer)
 */
export async function pushSubObjectByObjectId(parentObject, field, subObjectId) {
  parentObject[field].push(subObjectId);
  await parentObject.save();
}
