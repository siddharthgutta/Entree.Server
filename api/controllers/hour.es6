
import * as Hour from '../db/hours.es6';
import Moment from 'moment';

/**
 * Creates a new operating time for a specific producer
 *
 * @param  {String} day: the day of the week to look for
 * @param  {String} open: the time the producer opens
 * @param {String} close: the time the producer closes
 * @returns {Promise} the hour object created
 */

export async function create(day, open, close) {
  return await hour.create({
    day,
    openTime: open,
    closeTime: close
  });
}

/**
 * Converts the time into a number
 *
 * @param {String} hour: formatted String ('HH:mm')
 * @returns {number} the time formatted as a Number
 */
export function convertHour(hour) {
  return Number(new Moment(hour, 'HH:mm').format('HHmm'));
}

/**
 * Compares the hour objects in the Schema, used in the sort method
 * @param {Moment} first: the first object to compare to by openTime then closeTime
 * @param {Moment} second: the second object to compare to by openTime then closeTime
 * @returns {number}: returns 1 if the first is greater, -1 if the second is greater
 */
export function hourComp(first, second) {
  const firstTime = new Moment(first, 'HH:mm');
  const secondTime = new Moment(second, 'HH:mm');
  let ret = 0;
  if (firstTime.isBefore(secondTime)) ret = 1;
  else if (firstTime.isAfter(secondTime)) ret = -1;
  if (firstTime.isSame(secondTime)) ret = 0;
  return ret;
}
