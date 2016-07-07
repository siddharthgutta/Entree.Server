/**
 * Created by kfu on 7/6/16.
 */

import AttachmentMessageData from './attachment-message-data.es6';

export default class VideoAttachmentMessageData extends AttachmentMessageData {
  /**
   * Constructor for Video Message Data
   *
   * @param {String} url: url of video
   * @returns {VideoAttachmentMessageData} video message data object
   */
  constructor(url) {
    super({
      type: 'video',
      payload: {
        url
      }
    });
  }
}
