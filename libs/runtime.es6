/**
 * Created by jadesym on 6/20/16.
 */

import config from 'config';

const env = config.get('NodeEnv');

/**
 * @returns {boolean} true if system is running locally
 */
export function isLocal() {
  return env === 'local';
}

/**
 * @returns {boolean} true if system is being staged
 */
export function isStaging() {
  return env === 'staging';
}

/**
 * @returns {boolean} true if it is the master branch
 */
export function isProduction() {
  return env === 'production';
}

/**
 * @returns {String} node environment
 */
export function getEnv() {
  return env;
}
