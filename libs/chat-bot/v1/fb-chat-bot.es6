/* Disabling lint rule since it doesn't make sense. */
/* eslint-disable babel/generator-star-spacing,one-var,valid-jsdoc */

import _ from 'underscore';
import * as Consumer from '../../../api/controllers/consumer.es6';
import {GenericMessageData, TextMessageData, ReceiptMessageData, ButtonMessageData}
  from '../../msg/facebook/message-data.es6';

export const actions = {
  seeTrucks: 'See Trucks',
  orderFood: 'Order Food',
  moreInfo: 'More Info',
  confirmation: 'Confirmation',
  otherTrucks: 'Other Trucks'
};

export const events = {
  postback: 'Postback',
  text: 'Text',
  attachment: 'Attachment',
  delivery: 'Delivery'
};

export const restaurants = [
  {
    title: 'Panera Bread',
    subtitle: 'Fast-casual bakery chain that serves artisanal sandwiches, soups, and more. ',
    imageUrl: 'https://i.imgur.com/iEwGMjv.jpg'
  },
  {
    title: 'Chipotle',
    subtitle: 'Mexican fast-casual chain serving custom-made burritos and bowls. ',
    imageUrl: 'https://i.imgur.com/AC2PjhS.jpg'
  },
  {
    title: 'Chi\'lantro',
    subtitle: 'Austin, Texas based Korean-Mexican fusion with multiple food trucks and restaurants. ',
    imageUrl: 'https://i.imgur.com/j0W2jbo.jpg'
  }
];

const placeTypes = [PlaceTypes.restaurant, PlaceTypes.cafe, PlaceTypes.bakery];

export default class FbChatBot {
  constructor(msgPlatform) {
    this.msgPlatform = msgPlatform;

    // Delete a current conversation of Messenger (only on Desktop Messenger)
    // Then, search for the bot you are trying to have a conversation with
    // Then, the welcome message should be shown
    /* Setup welcome message */
    const welcomeMessage = new ButtonMessageData('Hi I\'m Entrée! I help you order food in advance and find ' +
      'new places to eat. We try to make ordering as fast and easy as possible. Press \"Trucks\" to see what ' +
      'food trucks we work at!');
    welcomeMessage.pushPostbackButton('Trucks', this._genPayload(actions.seeTrucks));
    msgPlatform.setWelcomeMessage(welcomeMessage.toJSON());
  }

  /**
   * Processes the input event and creates response for user
   *
   * @param {Object} event: input event from FB messenger
   * @returns {Object}: Messenger response to user
   */
  async handleInput(event) {
    const user = await this._findOrCreateUser(event);

    let output;
    switch (this._getEventType(event)) {
      case events.postback:
        output = await this._handlePostback(event, user);
        break;
      case events.text:
        output = await this._handleText(event, user);
        break;
      case events.attachment:
        output = await this._handleAttachment(event, user);
        break;
      case events.delivery:
        // This is an event that just tells us our delivery succeeded
        // We already get this in the response of the message sent

        break;
      default:
        console.tag('libs', 'chat-bot', 'v1', 'fb-chat-bot', 'INPUT ERROR').log(event);
        throw Error(`Error handing event input for event`);
    }
    return output;
  }

  /**
   * Handles postback events
   *
   * @param {Object} event: input event from messenger
   * @param {Object} user: user that sent the event
   * @returns {Object}: messenger output
   */
  async _handlePostback(event, user) {
    let payload, action;
    try {
      payload = JSON.parse(event.postback.payload);
      action = this._getAction(payload);
    } catch (err) {
      throw new TraceError('Could not get payload or action for event', err);
    }

    switch (action) {
      case actions.seeTrucks:
        return this._handleSeeTrucks();
      case actions.menu:
        return await this._handleMenu(payload);
      case actions.addItem:
        return this._handleAddItem(payload, user);
      case actions.orderAgain:
        return this._handleOrderAgain(payload);
      case actions.confirmation:
        return await this._handleConfirmation();
      case actions.requestLocation:
        return await this._handleRequestLocation();
      case actions.search:
        return await this._handleSearch();
      case actions.addToWishList:
        return await this._handleAddToWishList(payload, user);
      case actions.moreInfo:
        return await this._handleMoreInfo(payload);
      default:
        throw Error('Invalid payload action');
    }
  }

  /**
   * Handles text events
   *
   * @param {Object} event: input event from messenger
   * @param {Object} user: user that sent the event
   * @returns {Object}: messenger output
   */
  async _handleText(event, user) {
    const text = event.message.text;
    /* Assuming user entered in a US zip code */
    if (/^\d{5}$/.test(text)) {
      return await this._updateUserLocation(event, user);
    }

    return await this._search(event, user);
  }

  /**
   * Handles attachment events
   *
   * @param {Object} event: input event from messenger
   * @param {Object} user: user object that sent attachment
   * @returns {Object}: messenger output
   */
  async _handleAttachment(event, user) {
    /* The only attachment we are handling right now is location */
    const attachment = event.message.attachments[0];
    if (attachment.type === 'location') {
      return await this._updateUserLocation(event, user);
    }

    console.tag('libs', 'chat-bot', 'v1', 'fb-chat-bot', 'ATTACHMENT ERROR').log(attachment);
    throw Error(`Attachment did not contain location`);
  }

  /**
   * Executed when the user first starts the walk through
   *
   * @returns {Object}: GenericMessageData containing restaurants
   * @private
   */
  async _handleSeeTrucks() {
    let text, response;
    try {
      text = new TextMessageData('Here are the food trucks we currently support. ' +
        'Click any of the buttons at any time to place an order, see the menu, or get more information.');

      response = new GenericMessageData();
      _.each(restaurants, restaurant => {
        response.pushElement(restaurant.title, restaurant.subtitle, restaurant.imageUrl);
        response.pushPostbackButton('View Menu', this._genPayload(actions.menu, {restaurant}));
        response.pushPostbackButton('More Info', this._genPayload(actions.menu, {restaurant}));
        response.pushPostbackButton('Order Food', this._genPayload(actions.menu, {restaurant}));
      });
    } catch (err) {
      throw new TraceError('Failed to generate restaurants', err);
    }

    return [text, response];
  }

  /**
   * Executed after the user presses the Order Again button
   *
   * @returns {Object}: Button containing instructions on what to do next
   * @private
   */
  async _handleConfirmation() {
    let button;
    try {
      button = new ButtonMessageData('It\'s that easy! Now your reorder has been sent directly to the restaurant.' +
        ' With Entrée, we also notify you when your order is ready for pickup. All of these features are coming ' +
        'soon to your favorite restaurants. Click \'Continue\' to see what Entrée can do for you right now.');
      button.pushPostbackButton('Continue', this._genPayload(actions.requestLocation));
    } catch (err) {
      throw new TraceError('Failed to generate continue message', err);
    }

    return [button];
  }

  /**
   * Executed after user presses Continue
   *
   * @returns {Object}: Instructions on how to submit location
   * @private
   */
  async _handleRequestLocation() {
    let text;
    try {
      text = new TextMessageData('Now, you can search for restaurants near you. First, send us your location:' +
        '.\n1. For Android, click the \'…\' button, press \'Location\', and then press the send button\n' +
        '2. For iOS, tap the location button\n3. If you\'re on desktop, ' +
        'just type in your zip code (Ex: 78705)');
    } catch (err) {
      throw new TraceError('Failed to generate search message', err);
    }

    return [text];
  }

  /**
   * Executed when user presses the MoreInfo button on a specific restaurautn searched
   *
   * @param {Object} payload: Restaurant tht was searched
   * @returns {Object}: Buttons and more text information on the restaurant
   * @private
   */
  async _handleMoreInfo(payload) {
    let button;
    try {
      const placeId = this._getData(payload).placeId;

      button = new ButtonMessageData(`${details.name} has an average rating of ${details.rating}/5 and you ` +
        `can call them at ${details.formatted_phone_number}`);
      button.pushLinkButton('Location', `${details.url}`);
      button.pushLinkButton('Website', `${details.website}`);
      button.pushPostbackButton('Add to Wish list', this._genPayload(actions.addToWishList, {placeId}));
    } catch (err) {
      throw new TraceError('Could not get detailed information for place', err);
    }

    return [button];
  }

  /**
   * Updates a user's location
   *
   * @param {Object} event: input event from messenger
   * @returns {Object}: messenger output
   */
  async _updateUserLocation(event, user) {
    const inputText = event.message.text;
    if (inputText) { /* In this case the input is a zip code */
      try {
        // TODO Insert Consumer.AddLocation call here
      } catch (err) {
        // TODO Catch error for Consumer.AddLocation
      }
    } else { /* In this case the input is a location attachment sent from mobile */
      try {
        const attachment = event.message.attachments[0];
        // TODO Insert Consumer.addLocation call here
        // await User.UserModel.addLocation(user.fbId, attachment.payload.coordinates.lat,
        //   attachment.payload.coordinates.long);
      } catch (err) {
        // TODO Catch error for Consumer.AddLocation
      }
    }

    // TODO Insert response message data here
    // const text = new TextMessageData('Thanks! Now tell me your three favorite restaurants where you want to ' +
    //   'order from.  I will notify you when you can order food or get a great deal from there. Please separate ' +
    //   'them with a comma (Ex: Chick-fil-a, In-n-out, Chipotle)');
    // return [text];
    return [];
  }

  /**
   * Finds a user and creates one if the user does not exist
   *
   * @param {Object} event: Event corresponding to a user that sent us a message
   * @returns {Promise}: The user found or created
   * @private
   */
  async _findOrCreateUser(event) {
    const sender = event.sender.id;
    const user = await Consumer.findOneByFbId(sender);

    if (user) {
      return user;
    }

    const profile = await this.msgPlatform.getFacebookProfileInfo(sender);
    const newUser = await Consumer.createFbUser(sender, profile.first_name, profile.last_name);
    return newUser;
  }

  /**
   * Returns the event type
   *
   * @param {Object} event: input event from messenger
   * @returns {String}: the event type
   * @private
   */
  _getEventType(event) {
    if (event.postback) {
      return events.postback;
    }

    if (event.message && event.message.text) {
      return events.text;
    }

    if (event.message && event.message.attachments) {
      return events.attachment;
    }

    if (event.delivery) {
      return events.delivery;
    }

    return null;
  }

  _genPayload(action, data) {
    return JSON.stringify({action, data});
  }

  _getAction(payload) {
    return payload.action;
  }

  _getData(payload) {
    return payload.data;
  }
}
