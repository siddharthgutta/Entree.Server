import geolib from 'geolib';

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
