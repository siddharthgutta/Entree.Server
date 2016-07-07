import Moment from 'moment';
import * as Util from '../libs/utils.es6';
import _ from 'lodash';
/**
 * Puts the hours into buckets for each day
 * @param {Array} hours: producers hours to sort
 * @returns {Object} buckets of days containing the hours
 */
export function hourDict(hours) {
  const innerObj = {};
  _.forEach(hours, time => {
    if (Util.isEmpty(innerObj[time.day])) {
      innerObj[time.day] = [];
    }
    innerObj[time.day].push(time);
  });
  return innerObj;
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
  if (firstTime.isBefore(secondTime)) return 1;
  else if (firstTime.isAfter(secondTime)) return -1;
  return 0;
}
