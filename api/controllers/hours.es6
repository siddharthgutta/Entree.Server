import * as models from '../../models/mongo/index.es6';
const hour = models.hours;
/**
 * Creates a new operating time for a specific restaurant
 *
 * @param  {String} days: the day of the week to look for
 * @param  {String} open: the time the restaurant opens
 * @param {String} close: the time the restaurant closes
 * @returns {Promise} the hour object created
 */
export async function createHours(days, open, close) {
  return await hour.create({
    day: days,
    openTime: open,
    closeTime: close
  });
}
