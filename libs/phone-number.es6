/**
 * Created by kfu on 7/25/16.
 */

/**
 * Formats phone number string into the following form (NNN) NNN-NNNN
 *
 * @param {String} normalizedPhoneNumber: phone number in the following format NNNNNNNNNN
 * @returns {string}: formatted phone number string
 */
export function format(normalizedPhoneNumber) {
  return `(${normalizedPhoneNumber.slice(0, 3)}) ${normalizedPhoneNumber.slice(3, 6)}-` +
    `${normalizedPhoneNumber.slice(6, 10)}`;
}
