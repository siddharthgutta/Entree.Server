/**
 * Created by kfu on 4/14/16.
 */

import AttachmentMessageData from './attachment-message-data.es6';

export default class ImageMessageData extends AttachmentMessageData {
  /**
   * Constructor for Image Message Data
   *
   * @param {String} url: url of image
   * @returns {ImageMessageData} image message data object
   */
  constructor(url) {
    super({
      type: 'image',
      payload: {
        url
      }
    });
  }
}
