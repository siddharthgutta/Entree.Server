/**
 * Created by kfu on 4/13/16.
 */

import EventEmitter from 'events';

export default class MsgPlatform extends EventEmitter {
  static RECEIVED = 'msg-received';

  constructor() {
    super();
  }

  _handleEvent(event) {
    this.emit(MsgPlatform.RECEIVED, event);
  }

  /**
   * Sets the welcome message
   * Note: To delete the welcome message, pass in no parameter
   *
   * @param {String} pageId: REQUIRED page Id of the FB page
   * @param {String} pageAccessToken: REQUIRED access token of the FB page
   * @param {Object} messageData: REQUIRED message data, contents of the message
   * @return {Promise} Promise result with response or error
   */
  _setWelcomeMessage(pageId, pageAccessToken, messageData = null) {
    return new Promise((resolve, reject) => {
      request({
        url: `https://graph.facebook.com/v2.6/${pageId}/thread_settings`,
        qs: {access_token: pageAccessToken},
        method: 'POST',
        json: {
          setting_type: 'call_to_actions',
          thread_state: 'new_thread',
          call_to_actions: [
            {
              message: messageData
            }
          ]
        }
      }, (error, response, body) => {
        if (error) {
          console.log('Error setting welcome message: ', error);
          reject(error);
        } else if (response.body.error) {
          console.log('Error setting welcome message: ', response.body.error);
          reject(response.body.error);
        } else {
          console.log(`Successfully set welcome message:`, body);
          resolve(body);
        }
      });
    });
  }

  /**
   * Gets Facebook Profile Info
   *
   * @param {String} userId: facebook user id
   * @return {Object} Facebook user information
   */
  _getFacebookProfileInfo(userId, pageAccessToken) {
    return new Promise((resolve, reject) => {
      request({
        url: `https://graph.facebook.com/v2.6/${userId}`,
        qs: {
          fields: 'first_name,last_name,profile_pic',
          access_token: pageAccessToken
        },
        method: 'GET',
        json: true
      }, (error, response, body) => {
        if (error) {
          console.log('Error retrieving facebook profile info: ', error);
          reject(error);
        } else if (response.body.error) {
          console.log('Error: ', response.body.error);
          reject(response.body.error);
        } else {
          console.log(`Profile Info Body:`, body);
          resolve(body);
        }
      });
    });
  }

  /**
   * Sending a messsage to a specific Facebook recipient
   *
   * @param {Object} recipient: REQUIRED phone number or id of fb user - Phone# Format: +1(212)555-2368
   * @param {Object} messageData: REQUIRED message data, contents of the message
   * @param {String} notificationType: OPTIONAL notification type
   * @return {Promise} Promise result with response or error
   */
  _sendMessage(recipient, messageData, pageAccessToken, notificationType = NotificationType.SILENT_PUSH) {
    console.log(`Sending message to ${recipient.toString()}`,
      messageData);

    return new Promise((resolve, reject) => {
      request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: pageAccessToken},
        method: 'POST',
        json: {
          recipient,
          message: messageData,
          notification_type: notificationType
        }
      }, (error, response, body) => {
        if (error) {
          console.log('Error sending message: ', error);
          reject(error);
        } else if (response.body.error) {
          console.log('Error: ', response.body.error);
          reject(response.body.error);
        } else {
          console.log(`Response Body:`, body);
          console.log(`Recipient Id:`, body.recipient_id);
          console.log(`Message Id:`, body.message_id);
          resolve(body);
        }
      });
    });
  }
}
