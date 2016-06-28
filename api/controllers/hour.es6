import * as models from '../../models/mongo/index.es6';
const hour = models.hours;
/**
 * Creates a new operating time for a specific producer
 *
 * @param  {String} day1: the day of the week to look for
 * @param  {String} open: the time the producer opens
 * @param {String} close: the time the producer closes
 * @returns {Promise} the hour object created
 */
export async function create(day1, open, close) {
  return await hour.create({
    day: day1,
    openTime: open,
    closeTime: close
  });
}
