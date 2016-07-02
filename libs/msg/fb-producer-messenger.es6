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

export default class FBProducerMessenger extends MsgPlatform {
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
   * Sets the welcome message
   * Note: To delete the welcome message, pass in no parameter
   *
   * @param {Object} messageData: REQUIRED message data, contents of the message
   * @return {Promise} Promise result with response or error
   */
  async setWelcomeMessage(messageData = null) {
    await this._setWelcomeMessage(this.pageId, this.pageAccessToken, messageData);
  }

  /**
   * Gets Facebook Profile Info
   *
   * @param {String} userId: facebook user id
   * @return {Object} Facebook user information
   */
  async getFacebookProfileInfo(userId) {
    await this._getFacebookProfileInfo(userId, this.pageAccessToken);
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
    await this._sendMessage({id: recipientId}, messageData, this.pageAccessToken, notificationType);
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
    route.get('/producer/webhook', (req, res) => {
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
    route.post('/producer/webhook', async (req, res) => {
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
