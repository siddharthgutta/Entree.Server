/**
 * Created by kfu on 7/3/16.
 */

import SlackData from '../../../libs/notifier/slack-data.es6';
import Slack from '../../../libs/notifier/slack.es6';
import assert from 'assert';
import config from 'config';

const slackOrdersCredentials = config.get('Slack.orders');

describe('Slack Data', () => {
  it('should create a basic slack data object successfully', async () => {
    const correctAttachments = [
      {
        fallback: 'fallback text',
        color: 'good',
        fields: [
          {
            title: 'Test Field 1',
            value: 'Test Value 1',
            short: true
          }, {
            title: 'Test Field 2',
            value: 'Test Value 2',
            short: true
          }, {
            title: 'Environment',
            value: 'test',
            short: true
          }, {
            title: 'Type',
            value: 'FAKE',
            short: true
          }],
        mrkdwn_in: ['pretext'],
        pretext: 'FAKE | pretext'
      }
    ];
    const correctSlackData = {
      attachments: JSON.stringify(correctAttachments)
    };
    const slackData = new SlackData('fallback text', 'good', 'pretext');
    slackData.addFields('Test Field 1', 'Test Value 1');
    slackData.addFields('Test Field 2', 'Test Value 2');
    const finalData = slackData.getData();
    assert.deepEqual(finalData, correctSlackData);
  });

  it('should successfully send a slack message', async () => {
    const slackbot = new Slack(slackOrdersCredentials.apiToken, slackOrdersCredentials.username);
    const slackData = new SlackData('fallback text', 'good', 'pretext');
    slackData.addFields('Test Field 1', 'Test Value 1');
    slackData.addFields('Test Field 2', 'Test Value 2');
    await slackbot.send(slackOrdersCredentials.channelId, slackData.getData());
  });
});
