import geolib from 'geolib';
import _ from 'lodash';

/**
 * Calculates distance in miles between two points given longitude and latitude of each
 *
 * @param {Number} startLat: the latitude of the starting point
 * @param {Number} startLong: the longitude of the starting point
 * @param {Number} endLat: the latitude of the ending point
 * @param {Number} endLong: the longitude of the ending point
 * @returns {Number} the distance between the two points in miles
 */
export function calcDistanceInMiles(startLat, startLong, endLat, endLong) {
  const distanceInMeters = geolib.getDistance(
	{latitude: startLat, longitude: startLong},
	{latitude: endLat, longitude: endLong}
	);
  const distanceInMiles = geolib.convertUnit('mi', distanceInMeters, 1);
  return distanceInMiles;
}

/**
 * Given a starting location and an array of coordinates, returns an array sorted
 * in order of closest to furthest
 *
 * @param {Object} startCoord: an object containing the latitude and longitude of the starting location
 * @param {Array} endCoords: an array containing the latitude and longitude of the destinations
 * @returns {Array}: an array sorted by increasing distance [{latitude: x, longitude: y}]
 */
export function orderByDistance(startCoord, endCoords) {
  const sortedDistances = geolib.orderByDistance(
	{latitude: startCoord.latitude, longitude: startCoord.longitude}, endCoords
	);
  _(sortedDistances).forEach(value => {
    value.distance = geolib.convertUnit('mi', value.distance, 1);
  });
  return sortedDistances;
}
