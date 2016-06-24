/**
 * Created by kfu on 6/22/16.
 */

import * as Producer from '../db/producer.es6';

/**
 * Find the producer from its object id
 *
 * @param {ObjectId} _id: object id of the producer object
 * @returns {Producer}: the producer with the specific id
 */
export async function findOneByObjectId(_id) {
  return await Producer.findOne({_id});
}

/**
 * Create a producer in the database
 *
 * @param {String} name: name of the producer
 * @param {String} password: password for the producer
 * @param {String} description: description of the producer
 * @param {Object} optional: optional fields for the producer
 * @returns {Producer}: the producer that was just created
 */
export async function create(name, password, description, optional = {}) {
  return await Producer.create({name, password, description, ...optional});
}
