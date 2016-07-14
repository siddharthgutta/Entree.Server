import * as Location from '../db/location.es6';
import * as Utils from '../../libs/utils.es6';
import * as Google from './google.es6';

/**
 * Helper function to create a location object
 *
 * @param {number} lat: latitude of the location
 * @param {number} long: longitude of the location
 * @param {object} optional: optional attributes to create location object
 * @returns {Location} the created location object
 * @private
 */
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
 * @returns {Location} the created database object specifying the location
 */
export async function createWithAddress(address) {
  let {lat, lng} = await Google.getLocationCoordinatesFromAddress(address);
  lat = parseFloat(lat);
  lng = parseFloat(lng);
  return await _create(lat, lng, {address});
}

/**
 *Creates a location object given a latitude and longitude
 *
 * @param {number} lat: the latitude of the location
 * @param {number} long: the longitude of the location
 * @returns {Location} the created database object specifying the location
 */
export async function createWithCoord(lat, long) {
  const location = await _create(lat, long);
  if (Utils.isEmpty(location)) throw new Error('Failed to create a valid location');
  return location;
}

/**
 * Finds the location if available in the database given an address
 *
 * @param {String} address: the address of the location to be found
 * @returns {Location} the object matching the given address
 */
export async function findLocationFromAddress(address) {
  return await Location.findOne(address);
}
