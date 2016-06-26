/* Disabling lint rule since it doesn't make sense. */
/* eslint-disable babel/generator-star-spacing,one-var,valid-jsdoc */

import _ from 'lodash';
import * as Consumer from '../../../api/controllers/consumer.es6';
import {GenericMessageData, TextMessageData, ButtonMessageData} from '../../msg/facebook/message-data.es6';
import {actions} from './actions.es6';

export const events = {
  postback: 'Postback',
  text: 'Text',
  attachment: 'Attachment',
  delivery: 'Delivery'
};

export const producers = [
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
    subtitle: 'Austin, Texas based Korean-Mexican fusion with multiple food trucks and producers. ',
    imageUrl: 'https://i.imgur.com/j0W2jbo.jpg'
  }
];

export default class FbChatBot {
  constructor(msgPlatform) {
    // TODO Implement a base class that handles versioning
    this.msgPlatform = msgPlatform;

    // Delete a current conversation of Messenger (only on Desktop Messenger)
    // Then, search for the bot you are trying to have a conversation with
    // Then, the welcome message should be shown
    /* Setup welcome message */
    const welcomeMessage = new ButtonMessageData('Hi I\'m Entrée! I help you order food in advance and find ' +
      'new places to eat. We try to make ordering as fast and easy as possible. Press \"Trucks\" to see what ' +
      'food trucks we work at!');
    welcomeMessage.pushPostbackButton('Trucks', this._genPayload(actions.seeProducers));
    msgPlatform.setWelcomeMessage(welcomeMessage.toJSON());
  }

  /**
   * Processes the input event and creates response for producer
   *
   * @param {Object} event: input event from FB messenger
   * @returns {Object}: Messenger response to producer
   */
  async handleInput(event) {
    const consumer = await this._findOrCreateConsumer(event);

    let output;
    switch (this._getEventType(event)) {
      case events.postback:
        output = await this._handlePostback(event, consumer);
        break;
      case events.text:
        output = await this._handleText(event, consumer);
        break;
      case events.attachment:
        output = await this._handleAttachment(event, consumer);
        break;
      case events.delivery:
        // This is an event that just tells us our delivery succeeded
        // We already get this in the response of the message sent

        break;
      default:
        console.log(event);
        throw Error(`Error handing event input for event`);
    }
    return output;
  }

  /**
   * Handles postback events
   *
   * @param {Object} event: input event from messenger
   * @returns {Object}: messenger output
   */
  async _handlePostback(event) {
    let payload, action;
    try {
      payload = JSON.parse(event.postback.payload);
      action = this._getAction(payload);
    } catch (err) {
      throw new Error('Could not get payload or action for event', err);
    }

    switch (action) {
      case actions.seeProducers:
        return this._handleSeeProducers();
      case actions.moreInfo:
        return await this._handleMoreInfo(payload);
      case actions.orderPrompt:
        return await this._handleOrderPrompt(payload);
      default:
        throw Error('Invalid payload action');
    }
  }

  /**
   * Handles attachment events
   *
   * @param {Object} event: input event from messenger
   * @param {Object} producer: producer object that sent attachment
   * @returns {Object}: messenger output
   */
  async _handleAttachment(event, consumer) {
    /* The only attachment we are handling right now is location */
    const attachment = event.message.attachments[0];
    if (attachment.type === 'location') {
      return await this._updateConsumerLocation(event, consumer);
    }

    throw Error(`Attachment did not contain location`);
  }

  /**
   * Handles text events
   *
   * @param {Object} event: input event from messenger
   * @param {Object} consumer: consumer that sent the event
   * @returns {Object}: messenger output
   */
  async _handleText(event, consumer) {
    const text = event.message.text;
    try {
      const {context} = consumer;
      switch (context.lastAction) {
        case actions.order:
          return this._handleOrder(text, consumer);
        case actions.location:
          return this._handleRequestLocation(text, consumer);
        default:
          return this._handleInvalidText(text);
      }
    } catch (err) {
      throw new Error(`Could not handle text event: ${event} with error: ${err}`);
    }
  }

  /*
  async _handleLocationText(text, consumer) {
    if (/^\d{5}$/.test(text)) {
      // Assuming 5 digit number producer entered is a US zip code
      // return await this._updateConsumerLocation(event, consumer);
    }
  }
  */

  /**
   * Handle the order text sent by the consumer
   *
   * @param {String} text: text of the order sent by the consumer
   * @param {Consumer} consumer: consumer object of the consumer in the database
   * @returns {[MessageData]}: message data objects for the bot to respond with
   * @private
   */
  async _handleOrder(text, consumer) {
    let response;
    const {_id} = consumer.context.producer;
    try {
      // const producer = await Producer.findOneByObjectId(_id);
      // TODO Fire producer event here
      response = new ButtonMessageData('Your order has been sent to the food truck. The truck will send back a quote ' +
        'for the cost of your order. After that, you can confirm your order, so the food truck can start preparing ' +
        'your food. In the meantime, feel free to browse the other businesses we support by pressing' +
        '\"See Other Trucks\"');
      response.pushPostbackButton('See Other Trucks', this._genPayload(actions.seeProducers));
    } catch (err) {
      throw new Error(`Could not handle incoming order \"${text}\" from consumer |${consumer._id}| ` +
        `for producer |${_id}|.`);
    }
    return [response];
  }

  /**
   * Handles and invalid text input
   *
   * @param {String} text: the input text
   * @returns {[ButtonMessageData]}: button message data for invalid text
   * @private
   */
  _handleInvalidText(text) {
    let response;
    response = new ButtonMessageData(`Sorry, it looks like we don't know what do with your text \"${text}\" at this ` +
      `time. Please start over by pressing the \"Trucks\" button`);
    response.pushPostbackButton('Trucks', this._genPayload(actions.seeProducers));
    return [response];
  }

  /**
   * Handles the order prompting
   *
   * @returns {Object}: MessageData object
   * @private
   */
  async _handleOrderPrompt(payload) {
    let response;
    try {
      const producer = this._getData(payload).producer;
      response = new ButtonMessageData(`You can place your order for ${producer.name} by typing what you would like` +
        ` to order (Ex: \"Medium pizza with pepperoni and pineapples\". If you want to go back, you can press the ` +
        `\"See Trucks\" button.`);
      response.pushPostbackButton('See Trucks', this._genPayload(actions.seeProducers));
    } catch (err) {
      throw new Error('Failed to create handle order message');
    }
    return [response];
  }

  /**
   * Executed when the producer first starts the walk through
   *
   * @returns {Object}: GenericMessageData containing producers
   * @private
   */
  async _handleSeeProducers() {
    let text, response;
    try {
      text = new TextMessageData('Here are the food trucks we currently support. ' +
        'Click any of the buttons at any time to place an order, see the menu, or get more information.');

      response = new GenericMessageData();
      _.each(producers, producer => {
        response.pushElement(producer.title, producer.subtitle, producer.imageUrl);
        response.pushLinkButton('View Menu', 'https://www.yelp.com/austin');
        response.pushPostbackButton('More Info', this._genPayload(actions.moreInfo, {producer}));
        response.pushPostbackButton('Order Food', this._genPayload(actions.order, {producer}));
      });
    } catch (err) {
      throw new Error('Failed to generate producers', err);
    }

    return [text, response];
  }

  /**
   * Executed after the producer presses the Order Again button
   *
   * @returns {Object}: Button containing instructions on what to do next
   * @private
   */
  async handleOrderConfirmation(consumer) {
    let button;
    try {
      const {order} = consumer.context;
      button = new ButtonMessageData(`Your order ${order} has been sent directly to the truck.` +
        ` We\'ll tell you when your order will be ready once the truck receives your order.`);
      button.pushPostbackButton('Browse Trucks', this._genPayload(actions.seeProducers));
    } catch (err) {
      throw new Error('Failed to generate continue message', err);
    }
    return [button];
  }

  /**
   * Executed after producer presses Continue
   *
   * @returns {Object}: Instructions on how to submit location
   * @private
   */
  async _handleRequestLocation() {
    let text;
    try {
      text = new TextMessageData('Now, you can search for producers near you. First, send us your location:' +
        '.\n1. For Android, click the \'…\' button, press \'Location\', and then press the send button\n' +
        '2. For iOS, tap the location button\n3. If you\'re on desktop, ' +
        'just type in your zip code (Ex: 78705)');
    } catch (err) {
      throw new Error('Failed to generate search message', err);
    }

    return [text];
  }

  /**
   * Executed when producer presses the MoreInfo button on a specific producer searched
   *
   * @param {Object} payload: Producer tht was searched
   * @returns {Object}: Buttons and more text information on the producer
   * @private
   */
  async _handleMoreInfo(payload) {
    let button;
    try {
      const {producer} = this._getData(payload);
      button = new ButtonMessageData(`${producer}`);
      // TODO Google Maps Insert Location Information Here
      button.pushLinkButton('Location', `https://www.google.com/maps`);
      button.pushPostbackButton('Order Food', this._genPayload(actions.order, {producer}));
      button.pushPostbackButton('See Other Trucks', this._genPayload(actions.seeProducers));
    } catch (err) {
      throw new Error('Could not get detailed information for place', err);
    }

    return [button];
  }

  /**
   * Updates a producer's location
   *
   * @param {Object} event: input event from messenger
   * @returns {Object}: messenger output
   */
  async _updateConsumerLocation(event) {
    const inputText = event.message.text;
    let lat, long;
    if (inputText) { /* In this case the input is a zip code */
      try {
        // TODO Insert Consumer.AddLocation call here
      } catch (err) {
        // TODO Catch error for Consumer.AddLocation
      }
    } else { /* In this case the input is a location attachment sent from mobile */
      try {
        const attachment = event.message.attachments[0];
        lat = attachment.payload.coordinates.lat;
        long = attachment.payload.coordinates.long;
        console.log(attachment);
        // TODO Insert Consumer.addLocation call here
        // await Consumer.ConsumerModel.addLocation(producer.fbId, attachment.payload.coordinates.lat,
        //   attachment.payload.coordinates.long);
      } catch (err) {
        // TODO Catch error for Consumer.AddLocation
      }
    }

    // TODO Insert response message data here
    const button = new ButtonMessageData(`Thanks for sharing your location: ${lat}, ` +
      `${long}. We\'ll use your location to find food near ` +
      `you. For now, you can see the trucks that we currently support.`);
    button.pushPostbackButton('See Trucks', this._genPayload(actions.seeProducers));
    return [button];
  }

  /**
   * Finds a producer and creates one if the producer does not exist
   *
   * @param {Object} event: Event corresponding to a producer that sent us a message
   * @returns {Promise}: The producer found or created
   * @private
   */
  async _findOrCreateConsumer(event) {
    const sender = event.sender.id;
    let consumer;
    try {
      consumer = await Consumer.findOneByFbId(sender);
    } catch (err) {
      const profile = await this.msgPlatform.getFacebookProfileInfo(sender);
      const optionalConsumerFields = {
        consumer: {
          firstName: profile.first_name,
          lastName: profile.last_name
        }
      };
      consumer = await Consumer.createFbConsumer(sender, optionalConsumerFields);
    }
    return consumer;
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
