/**
 * Created by kfu on 4/21/16.
 */

import GoogleAPIStrategy from './strategy.es6';

export default class GoogleMapsGeocoding extends GoogleAPIStrategy {
  /**
   * Constructor for GoogleMapsGeocoding
   *
   * @param {String} apiKey: Google API Key
   * @returns {GoogleMapsGeocoding} GoogleMapsGeocoding object
   */
  constructor(apiKey) {
    super(apiKey);
  }

  /**
   * Gets a coordinates object from a zipcode containing longitude and latitude of a zip code
   * Ex: { "lat": 33.0787152, "lng": -96.8083063 }
   *
   * @param {String} zipcode: zipcode to get location coordinates for
   * @returns {*}: location object with lat and lng as keys
   */
  async getLocationFromZipcode(zipcode) {
    const responseBody = await this.apiCall(
      'https://maps.googleapis.com/maps/api/geocode/json',
      'GET', {address: zipcode, key: this.apiKey}
    );
    return responseBody.results[0].geometry.location;
  }

  /**
   * Gets a coordinates object from a address containing longitude and latitude of an address
   * Ex: { "lat": 33.0787152, "lng": -96.8083063 }
   *
   * @param {String} addr: address to get location coordinates for
   * @returns {*}: location object with lat and lng as keys
   */
  async getLocationFromAddress(addr) {
    const responseBody = await this.apiCall(
      'https://maps.googleapis.com/maps/api/geocode/json',
      'GET', {address: addr, key: this.apiKey}
    );
    if (!responseBody.results[0]) throw new Error('Invalid Input');
    else return responseBody.results[0].geometry.location;
  }

	/**
   * Gets the distance in miles from a coordinates object
   * Ex: { "lat": 33.0787152, "lng": -96.8083063 }
   *
   * @param {Number} startLat: latitude of the starting location
   * @param {Number} startLong: longitude of the starting location
   * @param {Number} endLat: latitude of the starting location
   * @param {Number} endLong: longitude of the starting location
   * @returns {Number} Number in miles describing the distance
   */
  async getDistanceInMiles(startLat, startLong, endLat, endLong) {
    const origin = `${startLat},${startLong}`;
    const destination = `${endLat},${endLong}`;
    const responseBody = await this.apiCall(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
      'GET', {units: 'imperial', origins: origin, destinations: destination, key: this.apiKey}
    );
    return parseInt(responseBody.rows[0].elements[0].distance.text, 10);
  }
}
