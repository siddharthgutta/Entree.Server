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

/**
 * Gets the port number from environment variables from the config.
 * Since we are doing branch deploy, the port is overriden by custom-environment-variables.json on staging
 *
 * @returns {Number} port number chosen
 */
function setPort() {
  return config.get('Server.port');
}

const port = setPort();

/**
 * @returns {String} app port
 */
export function getPort() {
  return port;
}

const branch = config.get('AppBranch');

/**
 * @returns {String} branch name
 */
export function getBranch() {
  return branch;
}
