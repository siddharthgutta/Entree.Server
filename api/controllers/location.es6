import * as Location from '../db/location.es6';
import * as distance from '../../libs/location-calc/distance.es6';
import * as Utils from '../../libs/utils.es6';
import * as Goog from './google.es6';


/**
 * Creates a location object given an address
 * Best if city and state or zipcode is provided
 *
 * @param {String} address: the address of the location
 * @returns {Object} the created database object specifying the location
 */
export async function createWithAddress(address) {
  const coordinates = await Goog.getLocationCoordinatesFromAddress(address);
  const combinedAttributes = {
    coordinates: {
      latitude: parseFloat(coordinates.lat),
      longitude: parseFloat(coordinates.lng)
    },
    address: address //eslint-disable-line
  };
  return await Location.create(combinedAttributes);
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
    coordinates: {
      latitude: lat,
      longitude: long
    }
  };
  return await Location.create(coordinates);
}

/**
 * Finds the location if available in the database given coordinates
 *
 * @param {number} lat: the latitude of the location to be found
 * @param {number} long: the longitude of the location to be found
 * @returns {Object} the object matching the given coordinates
 */
export async function findLocationFromCoordinates(lat, long) {
  const query = {
    coordinates: {
      latitude: lat,
      longitude: long
    }
  };
  return await Location.findOne(query);
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

/**
 * Finds the distance between two given location objects
 *
 * @param {Location} startLoc: location object describing the starting location
 * @param {Location} endLoc: location object describing the ending location
 * @returns {Number} the distance between the two locations in miles
 */
export function findDistanceInMiles(startLoc, endLoc) {
  if (Utils.isEmpty(startLoc) || Utils.isEmpty(endLoc)) throw new Error('Invalid Location');
  return distance.calcDistanceInMiles(startLoc.coordinates.latitude, startLoc.coordinates.longitude,
  endLoc.coordinates.latitude, endLoc.coordinates.longitude);
}

/**
 * Orders the ending locations in order of proximity from the starting location
 * in increasing order
 *
 * @param {Location} startLoc: an object containing the starting location
 * @param {[Location]} endLocs: an array containing objects that contain various destinations
 * @returns {Array} an array sorted in order of increasing distances from the starting location
 */
export function orderByDistance(startLoc, endLocs) {
  const endCoords = [];
  if (endLocs.constructor !== Array) throw new Error('Destinations must be in an array');
  if (Utils.isEmpty(startLoc)) throw new Error('Invalid starting location');
  for (let k = 0; k < endLocs.length; k++) {
    endCoords.push(endLocs[k].coordinates);
  }
  return distance.orderByDistance(startLoc.coordinates, endCoords);
}
