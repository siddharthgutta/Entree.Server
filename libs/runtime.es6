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
 * Gets the port number from environment variables for the server
 * If production/local environment, gets port from configs
 * If staging environment and predefined branch in configs, gets port from config
 * Otherwise, gets port from the NODE_PORT environment variable
 *
 * @returns {Number} port number chosen
 */
function setPort() {
  if (isProduction() || isLocal()) {
    return config.get('Server.port');
  }
  try {
    const branchName = config.get('AppBranch');
    return config.get(`Server.branch.${branchName}`);
  } catch (err) {
    return config.get('NodePort');
  }
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
