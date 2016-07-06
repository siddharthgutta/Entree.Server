/**
 * Created by kfu on 7/6/16.
 */

import MessageDataStrategy from './strategy.es6';

export default class AttachmentMessageData extends MessageDataStrategy {
  /**
   * Constructor for Message Data
   *
   * @param {String} attachment: attachment for the message data
   * @returns {AttachmentMessageData} attachment message data object
   */
  constructor(attachment) {
    super();
    this.messageData = {
      attachment
    };
  }
}
