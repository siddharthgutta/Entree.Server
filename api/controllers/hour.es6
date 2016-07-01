import * as Hour from '../db/hours.es6';
/**
 * Creates a new operating time for a specific producer
 *
 * @param  {String} day: the day of the week to look for
 * @param  {String} open: the time the producer opens
 * @param {String} close: the time the producer closes
 * @returns {Promise} the hour object created
 */

export async function create(day, open, close) {
  return await Hour.create({
    day,
    openTime: open,
    closeTime: close
  });
}
