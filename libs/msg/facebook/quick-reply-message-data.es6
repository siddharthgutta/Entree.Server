/**
 * Created by kfu on 7/1/16.
 */

import MessageDataStrategy from './strategy.es6';

export default class QuickReplyMessageData extends MessageDataStrategy {
  /**
   * Constructor for Quick Reply Message Data
   *
   * @param {String} text: 320 character limited text message
   * @returns {TextMessageData} generic message data object
   */
  constructor(text) {
    super();
    this.quickReplies = [];
    this.messageData = {
      text,
      quick_replies: this.quickReplies
    };
  }

  /**
   * Add a quick reply to the quick replies array
   *
   * @param {String} title: REQUIRED quick reply title
   * @param {String} payload: REQUIRED data that will be sent back to us via webhook, when clicked
   * @return {Null} unused return statement
   */
  pushQuickReply(title, payload) {
    this.quickReplies.push({
      content_type: 'text',
      title,
      payload
    });
  }
}
