import * as Location from '../db/location.es6';
import * as Utils from '../../libs/utils.es6';
import * as Google from './google.es6';

export async function _create(lat, long, optional = {}) {
  const coordinates = {
    latitude: lat,
    longitude: long
  };
  return await Location.create({coordinates, ...optional});
}

/**
 * Creates a location object given an address
 * Best if city and state or zipcode is provided
 *
 * @param {String} address: the address of the location
 * @returns {Object} the created database object specifying the location
 */
export async function createWithAddress(address) {
  const googleCoordinates = await Google.getLocationCoordinatesFromAddress(address);
  return await _create(parseFloat(googleCoordinates.lat), parseFloat(googleCoordinates.lng), {address});
}

/**
 *Creates a location object given a latitude and longitude
 *
 * @param {number} lat: the latitude of the location
 * @param {number} long: the longitude of the location
 * @returns {Object} the created database object specifying the location
 */
export async function createWithCoord(lat, long) {
  const location = await _create(lat, long);
  if (Utils.isEmpty(location)) throw new Error('Failed to create a valid location');
  return location;
}

/**
 * Finds the location if available in the database given an address
 *
 * @param {number} address: the address of the location to be found
 * @returns {Object} the object matching the given address
 */
export async function findLocationFromAddress(address) {
  return await Location.findOne(address);
}
