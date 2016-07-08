/**
 * Created by kfu on 7/3/16.
 */

import SlackData from '../../../libs/notifier/slack-data.es6';
import TypedSlackData from '../../../libs/notifier/typed-slack-data.es6';
import assert from 'assert';

// Commented out since this will spam the #orders channel
/*
import * as Slack from '../../../api/controllers/slack.es6';
import config from 'config';
const slackOrdersCredentials = config.get('Slack.orders');
*/

describe('Slack Data', () => {
  function compareObjects(expectedSlackData, actualSlackData) {
    expectedSlackData.attachments = JSON.parse(expectedSlackData.attachments);
    assert.deepEqual(actualSlackData, expectedSlackData);
  }

  const fallbacks = ['fallback text 1', 'fallback text 2'];
  const titles = ['Test Title 0', 'Test Title 1', 'Test Title 2', 'Test Title 3'];
  const values = ['Test Value 0', 'Test Value 1', 'Test Value 2', 'Test Value 3'];
  const colors = ['good', 'bad'];
  const pretexts = ['pretext 1', 'pretext 2'];

  describe('#SlackData', () => {
    it('#getData should stringify attachment', () => {
      const correctAttachments = [];
      const correctSlackData = {
        attachments: JSON.stringify(correctAttachments)
      };
      const slackData = new SlackData();
      const finalData = slackData.getData();
      assert.deepEqual(finalData, correctSlackData);
    });

    it('create a basic slack data object successfully', () => {
      const correctAttachments = [];
      const correctSlackData = {
        attachments: JSON.stringify(correctAttachments)
      };
      const slackData = new SlackData();
      compareObjects(correctSlackData, slackData);
    });

    describe('#pushAttachment', () => {
      it('should push an empty attachment correctly', () => {
        const correctAttachments = [{
          fields: []
        }];
        const correctSlackData = {
          attachments: JSON.stringify(correctAttachments)
        };
        const slackData = new SlackData();
        slackData.pushAttachment();
        compareObjects(correctSlackData, slackData);
      });

      it('should push multiple attachments correctly', () => {
        const correctAttachments = [{
          fields: []
        }, {
          fields: []
        }];
        const correctSlackData = {
          attachments: JSON.stringify(correctAttachments)
        };
        const slackData = new SlackData();
        slackData.pushAttachment();
        slackData.pushAttachment();
        compareObjects(correctSlackData, slackData);
      });
    });

    describe('#pushField', () => {
      it('should add a field to an attachment correctly', () => {
        const correctAttachments = [{
          fields: [{
            title: titles[0],
            value: values[0],
            short: true
          }]
        }];
        const correctSlackData = {
          attachments: JSON.stringify(correctAttachments)
        };
        const slackData = new SlackData();
        slackData.pushAttachment();
        slackData.pushField(titles[0], values[0], true);
        compareObjects(correctSlackData, slackData);
      });

      it('should add a long field to an attachment correctly', () => {
        const correctAttachments = [{
          fields: [{
            title: titles[0],
            value: values[0],
            short: false
          }]
        }];
        const correctSlackData = {
          attachments: JSON.stringify(correctAttachments)
        };
        const slackData = new SlackData();
        slackData.pushAttachment();
        slackData.pushField(titles[0], values[0], false);
        compareObjects(correctSlackData, slackData);
      });

      it('should add multiple fields to an attachment correctly', () => {
        const correctAttachments = [{
          fields: [{
            title: titles[0],
            value: values[0],
            short: true
          }, {
            title: titles[1],
            value: values[1],
            short: true
          }]
        }];
        const correctSlackData = {
          attachments: JSON.stringify(correctAttachments)
        };
        const slackData = new SlackData();
        slackData.pushAttachment();
        slackData.pushField(titles[0], values[0], true);
        slackData.pushField(titles[1], values[1], true);
        compareObjects(correctSlackData, slackData);
      });

      it('should add a field to multiple attachment correctly', () => {
        const correctAttachments = [{
          fields: [{
            title: titles[0],
            value: values[0],
            short: true
          }]
        }, {
          fields: [{
            title: titles[2],
            value: values[2],
            short: true
          }]
        }];
        const correctSlackData = {
          attachments: JSON.stringify(correctAttachments)
        };
        const slackData = new SlackData();
        slackData.pushAttachment();
        slackData.pushField(titles[0], values[0], true);
        slackData.pushAttachment();
        slackData.pushField(titles[2], values[2], true);
        compareObjects(correctSlackData, slackData);
      });

      it('should add multiple fields to multiple attachment correctly', () => {
        const correctAttachments = [{
          fields: [{
            title: titles[0],
            value: values[0],
            short: true
          }, {
            title: titles[1],
            value: values[1],
            short: true
          }]
        }, {
          fields: [{
            title: titles[2],
            value: values[2],
            short: true
          }, {
            title: titles[3],
            value: values[3],
            short: true
          }]
        }];
        const correctSlackData = {
          attachments: JSON.stringify(correctAttachments)
        };
        const slackData = new SlackData();
        slackData.pushAttachment();
        slackData.pushField(titles[0], values[0], true);
        slackData.pushField(titles[1], values[1], true);
        slackData.pushAttachment();
        slackData.pushField(titles[2], values[2], true);
        slackData.pushField(titles[3], values[3], true);
        compareObjects(correctSlackData, slackData);
      });
    });

    describe('#setFallback', () => {
      it('should set fallback for a single attachment correctly', () => {
        const correctAttachments = [{
          fields: [],
          fallback: fallbacks[0]
        }];
        const correctSlackData = {
          attachments: JSON.stringify(correctAttachments)
        };
        const slackData = new SlackData();
        slackData.pushAttachment();
        slackData.setFallback(fallbacks[0]);
        compareObjects(correctSlackData, slackData);
      });

      it('should set fallback for multiple attachments correctly', () => {
        const correctAttachments = [{
          fields: [],
          fallback: fallbacks[0]
        }, {
          fields: [],
          fallback: fallbacks[1]
        }];
        const correctSlackData = {
          attachments: JSON.stringify(correctAttachments)
        };
        const slackData = new SlackData();
        slackData.pushAttachment();
        slackData.setFallback(fallbacks[0]);
        slackData.pushAttachment();
        slackData.setFallback(fallbacks[1]);
        compareObjects(correctSlackData, slackData);
      });
    });

    describe('#setColor', () => {
      it('should set color for a single attachment correctly', () => {
        const correctAttachments = [{
          fields: [],
          color: colors[0]
        }];
        const correctSlackData = {
          attachments: JSON.stringify(correctAttachments)
        };
        const slackData = new SlackData();
        slackData.pushAttachment();
        slackData.setColor(colors[0]);
        const finalData = slackData.getData();
        assert.deepEqual(finalData, correctSlackData);
      });

      it('should set colors for multiple attachments correctly', () => {
        const correctAttachments = [{
          fields: [],
          color: colors[0]
        }, {
          fields: [],
          color: colors[1]
        }];
        const correctSlackData = {
          attachments: JSON.stringify(correctAttachments)
        };
        const slackData = new SlackData();
        slackData.pushAttachment();
        slackData.setColor(colors[0]);
        slackData.pushAttachment();
        slackData.setColor(colors[1]);
        compareObjects(correctSlackData, slackData);
      });
    });

    describe('#setPretext', () => {
      it('should set pretext for a single attachment correctly', () => {
        const correctAttachments = [{
          fields: [],
          mrkdwn_in: ['pretext'],
          pretext: pretexts[0]
        }];
        const correctSlackData = {
          attachments: JSON.stringify(correctAttachments)
        };
        const slackData = new SlackData();
        slackData.pushAttachment();
        slackData.setPretext(pretexts[0]);
        compareObjects(correctSlackData, slackData);
      });

      it('should set pretext for multiple attachments correctly', () => {
        const correctAttachments = [{
          fields: [],
          mrkdwn_in: ['pretext'],
          pretext: pretexts[0]
        }, {
          fields: [],
          mrkdwn_in: ['pretext'],
          pretext: pretexts[1]
        }];
        const correctSlackData = {
          attachments: JSON.stringify(correctAttachments)
        };
        const slackData = new SlackData();
        slackData.pushAttachment();
        slackData.setPretext(pretexts[0]);
        slackData.pushAttachment();
        slackData.setPretext(pretexts[1]);
        compareObjects(correctSlackData, slackData);
      });
    });
  });

  describe('#TypedSlackData', () => {
    it('should create a basic order slack data object successfully', async () => {
      const correctAttachments = [
        {
          fallback: 'FAKE | fallback text',
          color: 'good',
          fields: [
            {
              title: 'Environment',
              value: 'test',
              short: true
            }, {
              title: 'Type',
              value: 'FAKE',
              short: true
            },
            {
              title: 'Test Field 1',
              value: 'Test Value 1',
              short: true
            }, {
              title: 'Test Field 2',
              value: 'Test Value 2',
              short: true
            }],
          mrkdwn_in: ['pretext'],
          pretext: 'FAKE | pretext'
        }
      ];
      const correctSlackData = {
        attachments: JSON.stringify(correctAttachments)
      };
      const slackData = new TypedSlackData();
      slackData.pushAttachment();
      slackData.setColor('good');
      slackData.setPretext('pretext');
      slackData.pushField('Test Field 1', 'Test Value 1');
      slackData.pushField('Test Field 2', 'Test Value 2');
      slackData.setFallback('fallback text');
      compareObjects(correctSlackData, slackData);
    });
  });

  // Commented out since this will spam the #orders channel
  /*
  it('should successfully send a slack message', async () => {
    const slackData = new TypedSlackData();
    slackData.pushAttachment();
    slackData.setColor('danger');
    slackData.setPretext('pretext');
    slackData.pushField('Test Field 1', 'Test Value 1');
    slackData.pushField('Test Field 2', 'Test Value 2');
    slackData.setFallback('fallback text');
    await Slack.sendMessage(slackOrdersCredentials.channelId, slackData);
  });
  */
});
