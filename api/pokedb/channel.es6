import models from '../../models/pokemongo/index.es6';
import _ from 'lodash';
import * as Utils from '../../libs/utils.es6';

const Channel = models.Channel;

/**
 * IMPORTANT: Must return promises!
 */

/**
 * Creates a user
 *
 * @param {Object} attributes: key value pairs of the attributes we want to populate the Channel with
 * @returns {Promise}: returns a Channel object
 */
export async function create(attributes) {
  return await (new Channel(attributes)).save();
}

/**
 * Returns a single channel given a query
 *
 * @param {Object} attributes: key value pairs of the attributes we want to query by
 * @returns {Promise}: returns the Channel found
 */
export async function findOne(attributes, populateFields = []) {
  let findQuery = Channel.findOne(attributes);
  findQuery = _.reduce(populateFields, (query, field) =>
			findQuery.populate(field),
		findQuery);
  const channel = await findQuery.exec();
  if (Utils.isEmpty(channel)) {
    throw new Error(`Could not find channel with attributes:${attributes}`);
  }
  return channel;
}
