/* created by Andrew Poovey 06-23-2016*/
import moment from 'moment';
/**
 *
 * @param {moment} moment1 gives 'hh:mm a' formatted time
 * @returns {String} returns moment1 to 'HHmm' format
 */

export function convertToNum(moment1) {
  return (moment1.format('HHmm'));
}
/**
 *
 * @param {moment} moment1 gives 'HHmm' time
 * @returns {String} returns moment1 to
 * 'hh:mm a' string format
 */
export function convertToAM(moment1) {
  return (moment1.format('hh:mm a'));
}
const output = moment('21:30', 'HH:mm');
const str = convertToNum(output);
console.log(str);
convertToAM(output);
