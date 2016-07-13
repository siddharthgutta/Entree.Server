import Cleverbot from '../../libs/cleverbot/cleverbot.es6';
import config from 'config';

// Getting the cleverbot credentials from config files
const cleverbotCredentials = config.get('Cleverbot');

// Initializes the clever bot
const cleverbot = new Cleverbot(cleverbotCredentials.apiUser, cleverbotCredentials.apiKey,
  cleverbotCredentials.sessionName);

/**
 * Sends a input message to the cleverbot to get a response
 * @param {String} input: string input for the clever bot
 * @returns {Promise<String>} response to the input from the cleverbot
 */
export async function ask(input) {
  return await cleverbot.ask(input);
}
