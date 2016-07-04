/**
 * Created by kfu on 7/3/16.
 */

import Slack from '../../libs/notifier/slack.es6';
import config from 'config';

const slackOrdersCredentials = config.get('Slack');

const slackbot = new Slack(slackOrdersCredentials.apiToken, slackOrdersCredentials.username);

/**
 * Sends a SlackData Object to the slack channel
 *
 * @param {String} channelId: channelId for sending the message
 * @param {SlackData} slackData: SlackData object to be passed in
 * @returns {Promise}: Promise with response from Slack API call
 */
export async function sendMessage(channelId, slackData) {
  return await slackbot.send(channelId, slackData.getData());
}
