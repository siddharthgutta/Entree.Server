/**
 * Created by kfu on 6/24/16.
 */

import models from '../../models/mongo/index.es6';
import * as Utils from '../../libs/utils.es6';

const Merchant = models.Merchant;

/**
 * IMPORTANT: Must return promises!
 */

/**
 * Creates a merchant
 *
 * @param {Object} attributes: key value pairs of the attributes we want to populate the Producer with
 * @returns {Promise}: returns a Merchant object
 */
export async function create(attributes) {
  return await (new Merchant(attributes)).save();
}

/**
 * Returns a single merchant given a query
 *
 * @param {Object} attributes: key value pairs of the attributes we want to query by
 * @returns {Promise}: returns a Merchant object
 */
export async function findOne(attributes) {
  const merchant = await Merchant.findOne(attributes).exec();
  if (Utils.isEmpty(merchant)) {
    throw new Error(`Could not find merchant with attributes: ${attributes}`);
  }
  return merchant;
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
  const merchant = await Merchant.findOneAndUpdate(conditions, updates, options).exec();
  if (Utils.isEmpty(merchant)) {
    throw new Error(`Could not find and update merchant with attributes: ${conditions} with updates ${updates}`);
  }
  return merchant;
}
