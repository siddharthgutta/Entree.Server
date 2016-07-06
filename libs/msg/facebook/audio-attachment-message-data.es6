/**
 * Created by kfu on 7/6/16.
 */

import AttachmentMessageData from './attachment-message-data.es6';

export default class AudioAttachmentMessageData extends AttachmentMessageData {
  /**
   * Constructor for Audio Message Data
   *
   * @param {String} url: url of audio
   * @returns {AudioAttachmentMessageData} audio message data object
   */
  constructor(url) {
    super({
      type: 'audio',
      payload: {
        url
      }
    });
  }
}
