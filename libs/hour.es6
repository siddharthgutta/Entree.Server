import moment from 'moment';
import * as Util from '../libs/utils.es6';
import _ from 'lodash';

/**
 * Compares the hour objects in the Schema, used in the sort method
 * @param {Moment} first: the first object to compare to by openTime then closeTime
 * @param {Moment} second: the second object to compare to by openTime then closeTime
 * @returns {number}: returns 1 if the first is greater, -1 if the second is greater
 */
export function hourComp(first, second) {
  const firstTime = moment(first, 'HH:mm');
  const secondTime = moment(second, 'HH:mm');
  if (firstTime.isBefore(secondTime)) return 1;
  else if (firstTime.isAfter(secondTime)) return -1;
  return 0;
}

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
  _.forEach(innerObj, bucket => {
    bucket = bucket.sort(hourComp);
  });
  return innerObj;
}


export function format(hour) {
  const openMoment = moment(hour.openTime, 'HH:mm');
  let open = '';
  const closeMoment = moment(hour.closeTime, 'HH:mm');
  let close = '';
  if (openMoment.minute() === 0) open = openMoment.format('h A');
  else open = openMoment.format('h:mm A');
  if (closeMoment.minute() === 0) close = closeMoment.format('h A');
  else close = closeMoment.format('h:mm A');
  return `${open}-${close}`;
}
