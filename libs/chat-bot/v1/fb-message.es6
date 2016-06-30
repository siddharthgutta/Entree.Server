import _ from 'lodash';

import {NotificationType} from '../../msg/fb-messenger.es6';

export default class FbMessage {
  constructor() {
    this.consumer = {};
    this.producer = {};
  }

  queueConsumerMessages(fbId, messages) {
    if (!(fbId in this.consumer)) {
      this.consumer[fbId] = [];
    }

    this.consumer[fbId] = this.consumer[fbId].concat(messages);
  }

  queueProducerMessages(fbId, messages) {
    if (!(fbId in this.producer)) {
      this.producer[fbId] = [];
    }

    this.producer[fbId] = this.producer[fbId].concat(messages);
  }

  async sendMessages(consumerMsgPlatform, producerMsgPlatform) {
    _.forOwn(this.consumer, async (messages, fbId) => {
      _.forEach(messages, async msg => {
        await consumerMsgPlatform.sendMessageToId(fbId, msg.toJSON(), NotificationType.REGULAR);
      });
    });

    _.forOwn(this.producer, async (messages, fbId) => {
      _.forEach(messages, async msg => {
        await producerMsgPlatform.sendMessageToId(fbId, msg.toJSON(), NotificationType.REGULAR);
      });
    });
  }
}
