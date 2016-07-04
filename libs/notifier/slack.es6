/**
 * Created by kfu on 3/10/16.
 */

import slack from '@slack/client';
import NotifierStrategy from './notifier-data.es6';
import _ from 'lodash';
import Promise from 'bluebird';

export default class Slack extends NotifierStrategy {
  /**
   * Initialize Slack Bot
   *
   * @param {String} apiToken: bot api token
   * @param {String} username: username in slack channel
   * @returns {Slack}: slack bot object
   */
  constructor(apiToken, username) {
    super();
    this.username = username;
    this.webClient = new slack.WebClient(apiToken);
  }

  /**
   * Send message on slack channel
   *
   * @param {String} channelId: channel id of slack
   * @param {Object} data: SlackData object
   * @param {String} msg: message to be sent, set to null if using data
   * Can find the channel id from the following:
   * https://api.slack.com/methods/channels.list/test
   *
   * @returns {null}: returns nothing
   */
  async send(channelId, data, msg = '') {
    return new Promise((resolve, reject) => {
      _.merge(data, {username: this.username, as_user: true});
      return this.webClient.chat.postMessage(channelId, msg, data, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }
}
