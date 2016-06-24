/**
 * Created by kfu on 6/24/16.
 */

/**
 * Null or undefined check
 *
 * @param {*} a: object to check for null or undefined
 * @returns {boolean}: return if object is null or undefined
 */
export function isNullOrUndefined(a) {
  return typeof a === 'undefined' || a === null;
}

/**
 * Empty check for objects and string
 *
 * @param {*} a: object or string to check for null/undefined/empty string
 * @returns {boolean}: return if object is null/undefined/empty string
 */
export function isEmpty(a) {
  return isNullOrUndefined(a) || (typeof a === 'string' && !a.trim().length);
}
