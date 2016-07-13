import Cleverbot from 'cleverbot.io';
import Promise from 'bluebird';

export default class CleverBot {
  /**
   * Sets up the clever bot and initializes it
   * @param {String} apiUser: api user credentials
   * @param {String} apiKey: api key credentials
   * @param {String} sessionName: name of the session for the specific bot
   * @returns {Cleverbot} cleverbot object
   */
  constructor(apiUser, apiKey, sessionName) {
    this.bot = new Cleverbot(apiUser, apiKey);
    this.bot.setNick(sessionName);
    this.initialized = false;
    this._init();
  }

  /**
   * Initializes cleverbot
   * @returns {Promise}: promise for the creation of the clever bot
   */
  async _init() {
    const cleverbotInstance = this;
    return new Promise((resolve, reject) => {
      this.bot.create((err, session) => {
        if (err) reject(err);
        else {
          cleverbotInstance.initialized = true;
          resolve(session);
        }
      });
    });
  }

  /**
   * Send an input to the cleverbot and get a response
   * If the bot is not initialized yet, will reject asking a question/taking input
   *
   * @param {String} input: input string with input message
   * @returns {Promise<String>} returns response string
   */
  async ask(input) {
    return new Promise((resolve, reject) => {
      if (!this.initialized) {
        reject(new Error('Cleverbot has not fully initialized yet. Cannot send message yet.'));
      } else {
        this.bot.ask(input, (err, response) => {
          if (err) reject(err);
          else resolve(response);
        });
      }
    });
  }
}
