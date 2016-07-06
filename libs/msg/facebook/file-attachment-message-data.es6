/**
 * Created by kfu on 7/6/16.
 */

import AttachmentMessageData from './attachment-message-data.es6';

export default class FileAttachmentMessageData extends AttachmentMessageData {
  /**
   * Constructor for File Message Data
   *
   * @param {String} url: url of file
   * @returns {FileAttachmentMessageData} file message data object
   */
  constructor(url) {
    super({
      type: 'file',
      payload: {
        url
      }
    });
  }
}
