/**
 * Created by kfu on 4/13/16.
 */

import MsgPlatform from '../msg.es6';
import {Router} from 'express';
import bodyParser from 'body-parser';
import request from 'request';
import Promise from 'bluebird';

/**
 * Notification types for sending messages
 * Explanation:
 * REGULAR will emit a sound/vibration and a phone notification
 * SILENT_PUSH will just emit a phone notification
 * NO_PUSH will not emit either
 *
 * @type {{REGULAR: string, SILENT_PUSH: string, NO_PUSH: string}}
 */
export const NotificationType = {
  REGULAR: 'REGULAR',
  SILENT_PUSH: 'SILENT_PUSH',
  NO_PUSH: 'NO_PUSH'
};

export default class FBMessenger extends MsgPlatform {
  /**
   * FB Messenger constructor with the page specific access token
   *
   * @param {String} pageAccessToken: access token for specific page
   * @param {String} verificationToken: verification token for specific page webhook
   * @param {String} pageId: id of the page for the fb bot
   * @param {Boolean} productionOrSandbox: production or sandbox mode
   * @returns {FBMessenger} FBMessenger object
   */
  constructor(pageAccessToken, verificationToken, pageId, productionOrSandbox) {
    super();
    this.pageAccessToken = pageAccessToken;
    this.verificationToken = verificationToken;
    this.pageId = pageId;
    this.productionOrSandbox = productionOrSandbox;
  }

  /**
   * Sets a facebook messenger thread setting
   *
   * @param {Object} json: REQUIRED json for the thread setting
   * @return {Promise} Promise result with response or error
   */
  async _setThreadSetting(json) {
    return new Promise((resolve, reject) => {
      request({
        url: `https://graph.facebook.com/v2.6/${this.pageId}/thread_settings`,
        qs: {access_token: this.pageAccessToken},
        method: 'POST',
        json
      }, (error, response, body) => {
        if (error) {
          console.error('Error setting thread settings: ', error);
          reject(new Error(error));
        } else if (response.body.error) {
          console.error('Error setting thread settings: ', response.body.error);
          reject(new Error(response.body.error));
        } else {
          console.log(`Successfully set thread settings:`, body);
          resolve(body);
        }
      });
    });
  }

  /**

   * Sets the greeting text
   * Note: To delete the welcome message, pass in no parameter
   *
   * @param {Object} text: REQUIRED text, contents of the greeting text
   * @return {Promise} Promise result with response or error
   */
  async setGreetingText(text) {
    return await this._setThreadSetting({
      setting_type: 'greeting',
      greeting: {
        text
      }
    });
  }

  /**
   * Sets the get started button message
   *
   * @param {Object} payload: payload that will fire when the get started button is pressed
   * @return {Promise} Promise result with response or error
   */
  async setGetStartedButton(payload) {
    return await this._setThreadSetting({
      setting_type: 'call_to_actions',
      thread_state: 'new_thread',
      call_to_actions: [
        {
          payload
        }
      ]
    });
  }

  /**
   * Sets the persistent menu
   * Note: To delete the welcome message, pass in no parameter
   *
   * @param {Object} callToActions: REQUIRED call to actions, buttons to be pressed on the menu
   * @return {Promise} Promise result with response or error
   */
  async setPersistentMenu(callToActions = null) {
    return await this._setThreadSetting({
      setting_type: 'call_to_actions',
      thread_state: 'existing_thread',
      call_to_actions: callToActions
    });
  }

  /**
   * Gets Facebook Profile Info
   *
   * @param {String} userId: facebook user id
   * @return {Object} Facebook user information
   */
  getFacebookProfileInfo(userId) {
    return new Promise((resolve, reject) => {
      request({
        url: `https://graph.facebook.com/v2.6/${userId}`,
        qs: {
          fields: 'first_name,last_name,profile_pic',
          access_token: this.pageAccessToken
        },
        method: 'GET',
        json: true
      }, (error, response, body) => {
        if (error) {
          console.error('Error retrieving facebook profile info: ', error);
          reject(new Error(error));
        } else if (response.body.error) {
          console.error('Error: ', response.body.error);
          reject(new Error(response.body.error));
        } else {
          console.log(`Profile Info Body:`, body);
          resolve(body);
        }
      });
    });
  }

  /**
   * Sending a message to a specific Facebook phone number
   *
   * @param {String} recipientPhoneNumber: REQUIRED phone number of fb user - Format: +1(212)555-2368
   * @param {Object} messageData: REQUIRED message data, contents of the message
   * @param {String} notificationType: OPTIONAL notification type
   * @return {Null} unused return statement
   */
  async sendMessageToPhoneNumber(recipientPhoneNumber, messageData, notificationType = NotificationType.SILENT_PUSH) {
    await this._sendMessage({phone_number: recipientPhoneNumber}, messageData, notificationType);
  }

  /**
   * Sending a message to a specific Facebook recipient id
   *
   * @param {String} recipientId: REQUIRED fb id of recipient
   * @param {Object} messageData: REQUIRED message data, contents of the message
   * @param {String} notificationType: OPTIONAL notification type
   * @return {Null} unused return statement
   */
  async sendMessageToId(recipientId, messageData, notificationType = NotificationType.SILENT_PUSH) {
    await this._sendMessage({id: recipientId}, messageData, notificationType);
  }

  /**
   * Sending a messsage to a specific Facebook recipient
   *
   * @param {Object} recipient: REQUIRED phone number or id of fb user - Phone# Format: +1(212)555-2368
   * @param {Object} messageData: REQUIRED message data, contents of the message
   * @param {String} notificationType: OPTIONAL notification type
   * @private
   * @return {Promise} Promise result with response or error
   */
  _sendMessage(recipient, messageData, notificationType = NotificationType.SILENT_PUSH) {
    console.log(`Sending message to ${recipient.toString()}`,
      messageData);

    return new Promise((resolve, reject) => {
      request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: this.pageAccessToken},
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

  /**
   * Sets up webhook routers for accepint notifications from Facebook
   *
   * @returns {Router} Router object
   */
  router() {
    const route = new Router();
    route.use(bodyParser.urlencoded({extended: true}));

    /**
     * Verification for setting up initial webhook
     */
    route.get('/webhook', (req, res) => {
      console.log(`Received GET Verification Request:`, req.query);
      if (req.query['hub.verify_token'] === this.verificationToken) {
        console.log('Verification: SUCCEEDED');
        res.send(req.query['hub.challenge']);
        return;
      }
      console.log('Verification: FAILED');
      res.send('Error, wrong validation token');
    });

    /**
     * Webhook for accepting incoming messages/postbacks
     */
    route.post('/webhook', async (req, res) => {
      const entries = req.body.entry;
      console.log(req.body.entry);
      // Loop through each of the entries
      for (let i = 0; i < entries.length; i++) {
        const messagingEvents = entries[i].messaging;
        // Loop through each of the messaging events
        for (let j = 0; j < messagingEvents.length; j++) {
          this._handleEvent(messagingEvents[j]);
        }
      }
      res.sendStatus(200);
    });

    return route;
  }
}
