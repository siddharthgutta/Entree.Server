import * as Location from '../db/location.es6';
import * as Utils from '../../libs/utils.es6';
import * as Google from './google.es6';

export async function _create(coordinates, optional = '') {
  return await Location.create({coordinates, address: optional});
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
  const coordinates = {
    latitude: parseFloat(googleCoordinates.lat),
    longitude: parseFloat(googleCoordinates.lng)
  };
  return await _create(coordinates, address);
}

/**
 *Creates a location object given a latitude and longitude
 *
 * @param {number} lat: the latitude of the location
 * @param {number} long: the longitude of the location
 * @returns {Object} the created database object specifying the location
 */
export async function createWithCoord(lat, long) {
  const coordinates = {
    latitude: lat,
    longitude: long
  };
  const location = await _create(coordinates);
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
