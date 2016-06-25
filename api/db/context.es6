/**
 * Created by kfu on 6/24/16.
 */

import models from '../../models/mongo/index.es6';
import * as Utils from '../../libs/utils.es6';

const Context = models.Context;

/**
 * IMPORTANT: Must return promises!
 */

/**
 * Creates a context
 *
 * @param {Object} attributes: key value pairs of the attributes we want to populate the Producer with
 * @returns {Promise}: returns a Context object
 */
export async function create(attributes) {
  return await (new Context(attributes)).save();
}

/**
 * Returns a single context given a query
 *
 * @param {Object} attributes: key value pairs of the attributes we want to query by
 * @returns {Promise}: returns a Context object
 */
export async function findOne(attributes) {
  const context = await Context.findOne(attributes).exec();
  if (Utils.isEmpty(context)) {
    throw new Error(`Could not find context with attributes: ${attributes}`);
  }
  return context;
}

/**
 * Find one context and update it
 *
 * @param {Object} conditions: conditions to query on
 * @param {Object} updates: updates to apply to the context
 * @param {Object} options: options to modify the query
 * @returns {Promise}: returns the Context object
 */
export async function findOneAndUpdate(conditions, updates, options = null) {
  const context = await Context.findOneAndUpdate(conditions, updates, options).exec();
  if (Utils.isEmpty(context)) {
    throw new Error(`Could not find and update context with attributes: ${conditions} with updates ${updates}`);
  }
  return context;
}
