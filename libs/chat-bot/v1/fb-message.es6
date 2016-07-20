import _ from 'lodash';

import {NotificationType} from '../../msg/fb-messenger.es6';

/**
 * Class to encapsulate MessageData response items we send back to producers and consumer
 */

export default class FbMessage {
  constructor() {
    this.consumer = {};
    this.producer = {};
  }

  /**
   * Stores consumer messages to be sent
   *
   * @param {String} fbId: fbId of the consumer messages should be sent to
   * @param {Array} messages: messages to send
   * @returns {Null} Unused
   */
  queueConsumerMessages(fbId, messages) {
    if (!(fbId in this.consumer)) {
      this.consumer[fbId] = [];
    }

    this.consumer[fbId] = this.consumer[fbId].concat(messages);
  }

  /**
   * Stores producer messages to be sent
   *
   * @param {String} fbId: fbId of the producer messages should be sent to
   * @param {Array} messages: messages to send
   * @returns {Null} Unused
   */
  queueProducerMessages(fbId, messages) {
    if (!(fbId in this.producer)) {
      this.producer[fbId] = [];
    }

    this.producer[fbId] = this.producer[fbId].concat(messages);
  }

  /**
   * Sends all stored messages to consumer and producer
   *
   * @param {Object} consumerMsgPlatform: platform to send consumer messages with
   * @param {Object} producerMsgPlatform: platform to send producer messages with
   * @returns {Null} Unused
   */
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
