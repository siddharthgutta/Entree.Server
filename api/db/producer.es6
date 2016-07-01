import * as Utils from '../../libs/utils.es6';
import _ from 'lodash';
import models from '../../models/mongo/index.es6';
const Producer = models.Producer;

/**
* Creates a producer
*
* @param {Object} attributes: key value pairs of the attributes we want to populate the Producer with
*@returns {Promise}: returns a Producer object
*/
export async function create(attributes) {
  return await (new Producer(attributes)).save();
}

/**
 * Returns a single producer given a query
 *
 * @param {Object} attributes: key value pairs of the attributes we want to query by
 * @param {Array<String>} populateFields: fields to populate query with
 * @returns {Promise}: returns a Producer object
 */
export async function findOne(attributes, populateFields = []) {
  let findQuery = Producer.findOne(attributes);
  findQuery = _.reduce(populateFields, (query, field) =>
      findQuery.populate(field),
    findQuery);
  const producer = await findQuery.exec();
  if (Utils.isEmpty(producer)) {
    throw new Error(`Could not find producer with attributes: ${attributes}`);
  }
  return producer;
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
export async function find(conditions, limit, sortFields, populateFields) {
  let findQuery = Producer.find(conditions);
  findQuery = _.reduce(populateFields, (query, field) =>
  findQuery.populate(field), findQuery);
  if (limit <= 0) return await findQuery.exec();
  return await findQuery.limit(limit).sort(sortFields).exec();
}

/**
 * Find one merchant and update it
 *
 * @param {Object} conditions: conditions to query on
 * @param {Object} updates: updates to apply to the merchant
 * @param {Object} options: options to modify the query
 * @returns {Promise}: returns the Merchant object
 */
export async function findOneAndUpdate(conditions, updates, options = null) {
  const producer = await Producer.findOneAndUpdate(conditions, updates, options).exec();
  if (Utils.isEmpty(producer)) {
    throw new Error(`Could not find and update merchant with attributes: ${conditions} with updates ${updates}`);
  }
  return producer;
}
