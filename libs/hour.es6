import Moment from 'moment';
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
