/**
 * Created by kfu on 6/24/16.
 */

import * as Context from '../db/context.es6';
import _ from 'lodash';

/**
 * Create a context from their percentageFee and transactionFee
 *
 * @returns {Promise} returns the context from the database
 */
export async function create(optional = {}) {
  return await Context.create({...optional});
}

/**
 * Finds a context by its object id
 *
 * @param {ObjectId} _id: the object id of the Context
 * @returns {Promise}: return the Context from the database
 */
export async function findOneByObjectId(_id, populateFields = []) {
  return await Context.findOne({_id}, populateFields);
}

/**
 * Empties the last action of a context object
 *
 * @param {ObjectId} _id: object id of the context object
 * @param {Array<String>} fields: array for fields to update to empty
 * @returns {Promise}: context object without the updates
 */
export async function emptyFields(_id, fields) {
  // Transforms the array of field names into an object with fields all mapping to undefined
  const emptiedFields = _.zipObject(fields, _.times(fields.length, () => undefined));
  return await Context.findOneAndUpdate({_id}, {$set: emptiedFields}, {runValidators: true});
}

/**
 * Sets the producer of a context object
 *
 * @param {ObjectId} _id: object id of the context object
 * @param {Object} fields: key/value pairs for fields to update
 * @returns {Promise}: context object without the updates
 */
export async function updateFields(_id, fields) {
  return await Context.findOneAndUpdate({_id}, {$set: fields}, {runValidators: true});
}
