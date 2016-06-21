/**
 * Created by jadesym on 6/20/16.
 */

import config from 'config';

const env = config.get('NodeEnv');

function setPort() {
  if (isProduction() || isLocal()) {
    return config.get('Server.port');
  } else {
    try {
      const branchName = config.get('AppBranch');
      return config.get(`Server.branch.${branchName}`);
    } catch (err) {
      return config.get('NodePort');
    }
  }
}

const port = setPort();

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
 * @returns {String} app port
 */
export function getPort() {
  return port;
}
