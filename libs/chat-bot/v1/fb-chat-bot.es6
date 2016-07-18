/* Disabling lint rule since it doesn't make sense. */
/* eslint-disable babel/generator-star-spacing,one-var,valid-jsdoc */

import * as Order from '../../../api/controllers/order.es6';
import {GenericMessageData, TextMessageData} from '../../msg/facebook/message-data.es6';
import {ProducerActions} from './actions.es6';
import OrderStatuses from '../../../models/constants/order-status.es6';
import FbMessage from './fb-message.es6';
import {GenericMessageData, TextMessageData, ButtonMessageData,
  ImageAttachmentMessageData, QuickReplyMessageData, CallToAction} from '../../msg/facebook/message-data.es6';
import {actions} from './actions.es6';
import Constants from './constants.es6';
import TypedSlackData from '../../notifier/typed-slack-data.es6';
import * as Slack from '../../../api/controllers/slack.es6';
import config from 'config';
import * as Runtime from '../../runtime.es6';
import * as Google from '../../../api/controllers/google.es6';
import * as Utils from '../../utils.es6';
import moment from 'moment';
import _ from 'lodash';
import * as Hour from '../../hour.es6';
const slackOrderChannelId = config.get('Slack.orders.channelId');
const slackSuggestionChannelId = config.get('Slack.suggestions.channelId');


export default class FbChatBot {

  static taskListLimit = 10;

  static events = {
    postback: 'Postback',
    text: 'Text',
    attachment: 'Attachment',
    quickReply: 'Quick Reply'
  };

  static formatString = 'MM/DD hh:mm a';

  /**
   * Generates a list of tasks for the producer
   *
   * @param {ObjectId} producerId: the object Id of the producer we are generating the list for
   * @param {Array<String>} statuses: the statuses of the orders that we want to query
   * @param {Number} limit: the maximum size of the order list
   * @returns {[GenericMessageData]}: generic message data response
   */
  async generateTaskList(producerId, statuses, limit) {
    const orders = await Order.findByStatusForProducer(producerId, statuses, limit);
    if (orders.length === 0) {
      return new TextMessageData(`You do not have any orders that are ${statuses.join(' or ')} right now.`);
    const message = new GenericMessageData();
    _.forEach(orders, order => {
      const {consumer} = order;
      const date = moment(order.createdAt);
      if (order.status === OrderStatuses.requestQuote) {
        message.pushElement(`Quote Request from ${consumer.firstName} ${consumer.lastName} at` +
          ` ${date.format(FbChatBot.formatString)}`, `Order: ${order.body}`);
        message.pushPostbackButton('Give Quote', this.genPayload(ProducerActions.quote, {orderId: order._id}));
        message.pushPostbackButton('Decline', this.genPayload(ProducerActions.decline, {orderId: order._id}));
      } else if (order.status === OrderStatuses.pending) {
        message.pushElement(`Order Request from ${consumer.firstName} ${consumer.lastName} at` +
          ` ${date.format(FbChatBot.formatString)}`, `Order: ${order.body}`);
        message.pushPostbackButton('Accept', this.genPayload(ProducerActions.accept, {orderId: order._id}));
        message.pushPostbackButton('Decline', this.genPayload(ProducerActions.decline, {orderId: order._id}));
      } else if (order.status === OrderStatuses.inProgress) {
        message.pushElement(`In progress order from ${consumer.firstName} ${consumer.lastName} at` +
          ` ${date.format(FbChatBot.formatString)}`, `Order: ${order.body}`);
        message.pushPostbackButton('Ready', this.genPayload(ProducerActions.ready, {orderId: order._id}));
      }
    });
  }
export const events = {
  postback: 'Postback',
  text: 'Text',
  attachment: 'Attachment',
  delivery: 'Delivery',
  quickReply: 'Quick Reply'
};

export default class FbChatBot {
  constructor(msgPlatform) {
    // TODO Implement a base class that handles versioning
    this.msgPlatform = msgPlatform;
    // Sets the payload for the get started message
    this.msgPlatform.setGetStartedButton(this._genPayload(actions.getStarted));
    // Sets up the persistent menu
    const callToActions = new CallToAction();
    callToActions.pushLinkButton('Entrée Website', `https://entreebot.com`);
    // callToActions.pushLinkButton('Help', `https://entreebot.com`);
    // callToActions.pushLinkButton('Request a Truck ', `https://entreebot.com`);
    // callToActions.pushLinkButton('Contact', `https://entreebot.com`);
    // callToActions.pushLinkButton('Update My Location', `https://entreebot.com`);
    callToActions.pushPostbackButton('See Trucks', this._genPayload(actions.seeProducers));
    callToActions.pushPostbackButton('Update My Location', this._genPayload(actions.updateLocation));
    this.msgPlatform.setPersistentMenu(callToActions.toJSON());
    // Sets the Greeting text
    this.msgPlatform.setGreetingText('Entrée helps you find and order ahead from the best food trucks around you.');
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
      case events.quickReply:
        output = await this._handleQuickReply(event, consumer);
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
   * Handles quick reply events
   *
   * @param {Object} event: input event from messenger
   * @param {Consumer} consumer: consumer object from database
   * @returns {Object}: messenger output
   */
  async _handleQuickReply(event, consumer) {
    let payload, action;
    try {
      payload = JSON.parse(event.message.quick_reply.payload);
      action = this._getAction(payload);
    } catch (err) {
      throw new Error('Could not get payload or action for quick reply event', err);
    }
    switch (action) {
      case actions.android:
        return this._handleAndroid(consumer);
      case actions.ios:
        return this._handleios(consumer);
      case actions.desktop:
        return this._handleDesktop(consumer);
      case actions.existingLocation:
        return this._handleSeeProducers(consumer);
      case actions.newLocation:
        return this._handleWhichPlatform();
      default:
        throw Error('Invalid quick reply payload action');
    }
  }

  /**
   * Handles postback events
   *
   * @param {Object} event: input event from messenger
   * @returns {Object}: messenger output
   */
  async _handlePostback(event, consumer) {
    let payload, action;
    try {
      payload = JSON.parse(event.postback.payload);
      action = this._getAction(payload);
    } catch (err) {
      throw new Error('Could not get payload or action for event', err);
    }
    switch (action) {
      case actions.getStarted:
        return this._handleGetStarted();
      case actions.seeProducers:
        return this._handleExistingLocationPrompt(consumer);
      case actions.updateLocation:
        return this._handleWhichPlatform();
      case actions.moreInfo:
        return await this._handleMoreInfo(payload);
      case actions.menu:
        return await this._handleMenu(payload);
      case actions.orderPrompt:
        return await this._handleOrderPrompt(payload, consumer);
      case actions.suggestionPrompt:
        return await this._handleProducerSuggestion(consumer);
      default:
        throw Error('Invalid postback payload action');
    }
  }

	/**
   * Handles location attachments
   *
   * @param {Object} event: input event from messenger
   * @param {Object} consumer: consumer object that sent attachment
   * @returns {Object}: messenger output
   * @private
	 */
  async _handleLocationAttachment(event, consumer) {
    const {context} = consumer;
    switch (context.lastAction) {
      case actions.location:
        await this._updateConsumerLocation(event, consumer);
        return await this._handleSeeProducers(consumer);
      default:
        // For now, if a location is sent, always show trucks, but could have different use case in the future
        await this._updateConsumerLocation(event, consumer);
        return await this._handleSeeProducers(consumer);
    }
  }


  /**
   * Handles attachment events
   *
   * @param {Object} event: input event from messenger
   * @param {Object} consumer: consumer object that sent attachment
   * @returns {Object}: messenger output
   */
  async _handleAttachment(event, consumer) {
    const attachment = event.message.attachments[0];
    try {
      switch (attachment.type) {
        case Constants.location:
          return await this._handleLocationAttachment(event, consumer);
        case Constants.audio:
          return [new TextMessageData('Dank audio bro. Doesn\'t sound as good as ordering food, though.')];
        case Constants.image:
          return [new TextMessageData('You look lovely in that photo. How about ordering some food, though?')];
        case Constants.file:
          return [new TextMessageData('Better keep those secret files to yourself and order some food.')];
        case Constants.video:
          return [new TextMessageData('Whoa! That\'s a bit graphic! Let\'s get back to the food, though.')];
        default:
          throw Error('Invalid attachment sent');
      }
    } catch (err) {
      throw new Error(`Could not handle attachment with error: ${err}`);
    }
  }

  /**
   * Handles text events
   *
   * @param {Object} event: input event from messenger
   * @param {Promise<Consumer>} consumer: consumer that sent the event
   * @returns {Object}: messenger output
   */
  async _handleText(event, consumer) {
    const text = event.message.text;

    // HACKY SHIT THAT SHOULD BE REMOVED AFTER WE HAVE PRODUCER BOTS
    if (/^(yes)|(cancel)$/.test(text.toLowerCase())) {
      console.log(`Consumer |${consumer._id}| typed in [${text}]`);
      return [];
    }
    // HACKY SHIT THAT SHOULD BE REMOVED AFTER WE HAVE PRODUCER BOTS

    try {
      const {context} = consumer;
      switch (context.lastAction) {
        case actions.order:
          return this._handleOrder(text, consumer);
        case actions.location:
          try {
            await this._updateConsumerLocation(event, consumer);
          } catch (err) {
            return [(new TextMessageData('We could not find a location from that address. Please try again.'))];
          }
          return await this._handleSeeProducers(consumer);
        case actions.suggestion:
          return await this._slackSuggestion(consumer, text);
        default:
          return this._handleInvalidText(text);
      }
    } catch (err) {
      throw new Error(`Could not handle text event: ${event} with error: ${err}`);
    }
  }

  /**
   * Handles the get started button being pressed
   *
   * @returns {[ButtonMessageData]}: returns the button message data for the welcome message
   * @private
   */
  _handleGetStarted() {
    const button = new ButtonMessageData(`Hello! I'm Entrée, a personal assistant designed to help you order ` +
      `food ahead for pick-up at food trucks. With just a few taps, clicks, or messages you can order food faster ` +
      `and easier than ever! Tap the "Show Trucks" button below to see a selection of food trucks you can order ` +
      `ahead from.`);
    button.pushPostbackButton('Trucks', this._genPayload(actions.seeProducers));
    return [button];
  }


  /**
   * Handles the get started button being pressed
   *
   * @returns {[ButtonMessageData]}: returns the button message data for the welcome message
   * @private
   */
  _handleGetStarted() {
    const button = new ButtonMessageData(`Hello! I'm Entrée, a personal assistant designed to help you order ` +
      `food ahead for pick-up at food trucks. With just a few taps, clicks, or messages you can order food faster ` +
      `and easier than ever! Tap the "Show Trucks" button below to see a selection of food trucks you can order ` +
      `ahead from.`);
    button.pushPostbackButton('Trucks', this._genPayload(actions.seeProducers));
    return [button];
  }

  /**
   * Handle the menu actions by sending menu link image
   *
   * @param {Object} payload: payload passed from postback button
   * @returns {[ImageMessageData]}: image of the menu
   */
  async _handleMenu(payload) {
    let image, button;
    try {
      const {producerId} = this._getData(payload);
      const producer = await Producer.findOneByObjectId(producerId);
      image = new ImageAttachmentMessageData(producer.menuLink);
      button = new ButtonMessageData(`Here is the ${producer.name} menu. Tap the image to see it full screen ` +
        `or choose one of the following options.`);
      button.pushPostbackButton('More Info', this._genPayload(actions.moreInfo, {producerId: producer._id}));
      button.pushPostbackButton('Order Food', this._genPayload(actions.orderPrompt, {producerId: producer._id}));
      button.pushPostbackButton('See Trucks', this._genPayload(actions.seeProducers));
    } catch (err) {
      throw new Error('Could not get menu Link image', err);
    }

    return [image, button];
  }

  /**
   * Handle the order text sent by the consumer
   *
   * @param {String} text: text of the order sent by the consumer
   * @param {Promise<Consumer>} consumer: consumer object of the consumer in the database
   * @returns {[ButtonMessageData]}: message data objects for the bot to respond with
   * @private
   */
  async _handleOrder(text, consumer) {
    let response;
    const {_id: consumerId, context: {_id: contextId, producer: producerId}} = consumer;
    console.log(`Handle Order ${JSON.stringify(consumer)}`);
    try {
      const order = await Order.create(text, producerId, consumerId);
      const producer = await Producer.findOneByObjectId(producerId);
      if (!(Producer.isOpen(producer.hours))) {
        return this._hoursClosed(producer);
      }
      await Order.pushOrderByObjectId([consumer, producer], order._id);
      // Send order message to slack
      await this._sendOrderMessage(consumer, producer, order);
      response = new ButtonMessageData('Your order has been sent. We will let you know when it has been accepted!');
      response.pushPostbackButton('See Other Trucks', this._genPayload(actions.seeProducers));
      await Context.emptyFields(contextId, ['producer', 'lastAction']);
    } catch (err) {
      throw new Error(`Could not handle incoming order \"${text}\" from consumer |${consumerId}| ` +
        `for producer |${producerId}|.`);
    }
    return [response];
  }

  /**
   * Sends the order to the #orders slack channel
   *
   * @param {Consumer} consumer: consumer object of the individual who ordered
   * @param {Producer} producer: producer object of the producer the individual ordered from
   * @param {Order} order: the order created by the consumer
   * @private
   */
  async _sendOrderMessage(consumer, producer, order) {
    const pretext = 'Incoming Order';
    const consumerName = `${consumer.firstName} ${consumer.lastName}`;
    const slackData = new TypedSlackData();
    slackData.pushAttachment();
    slackData.setColor(Runtime.isProduction() ? 'good' : 'danger');
    slackData.setPretext(pretext);
    slackData.setFallback(`${pretext}: ${consumerName} from ${producer.name} of ` +
      `[${order.body}] for $${order.price}`);
    slackData.pushField('Text Body', order.body, false);
    slackData.pushField('Consumer', consumerName);
    slackData.pushField('Producer', producer.name);
    slackData.pushField('Price', `${order.price}`);
    const response = await Slack.sendMessage(slackOrderChannelId, slackData);
    console.log(response);
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
      `time. Please start over by pressing the \"Trucks\" button. If you were trying to look up trucks ` +
      `in a different location, press "Update My Location" to update your location.`);
    response.pushPostbackButton('Trucks', this._genPayload(actions.seeProducers));
    response.pushPostbackButton('Update My Location', this._genPayload(actions.updateLocation));
    return [response];
  }

  /**
   * Gets the hours a producer is open on for a certain day
   *
   * @param {Array} hours: an array of hours for a producer
   * @param {string} day: the day of the week to check the hours for
   * @returns {string} the formatted hours that the producer is open for for a certain day
   * @private
   */
  _getHoursForADay(hours, day) {
    let openHours;
    const hourArr = [];
    _.forEach(hours, hour => {
      if (hour.day === day) {
        hourArr.push(Hour.format(hour));
      }
    });
    openHours = hourArr.join(', ');
    if (openHours.length === 0) openHours = 'Closed';
    return openHours;
  }

  /**
   * Gets the hours a producer is open on for a certain day
   *
   * @param {Array} hours: an array of hours for a producer
   * @param {string} day: the day of the week to check the hours for
   * @returns {string} the formatted hours that the producer is open for for a certain day
   * @private
   */
  _getHoursForADay(hours, day) {
    let openHours = '';
    const hourArr = [];
    _.forEach(hours, hour => {
      if (hour.day === day) {
        hourArr.push(Hour.format(hour));
      }
      openHours = hourArr.join(', ');
    });
    if (openHours.length === 0) openHours = 'Closed';
    return openHours;
  }

  /**
   * Finds the hours for the day its closed and the next day
   *
   * @param {Object} producer: the producer to find the closed hours for
   * @returns {Object} ButtonMessage object
   * @private
   */
  _hoursClosed(producer) {
    let response;
    const day = moment();
    const tmrw = day.add(1, 'day').format('dddd');
    const today = this._getHoursForADay(producer.hours, moment().format('dddd'));
    const tomorrow = this._getHoursForADay(producer.hours, tmrw);
    response = new ButtonMessageData(`Sorry ${producer.name} is currently closed.\n` +
      `Today's Hours: ${today}\nTomorrow's Hours: ${tomorrow}`);
    response.pushPostbackButton('Go Back', this._genPayload(actions.seeProducers));
    return [response];
  }

  /**
   * Handles the order prompting
   *
   * @returns {Object}: MessageData object
   * @private
   */
  async _handleOrderPrompt(payload, consumer) {
    let response;
    try {
      const {producerId} = this._getData(payload);
      const producer = await Producer.findOneByObjectId(producerId);
      if (!(Producer.isOpen(producer.hours))) {
        return this._hoursClosed(producer);
      }
      const {context: {_id: contextId}} = consumer;
      await Context.updateFields(contextId, {lastAction: actions.order, producer: producer._id});
      response = new ButtonMessageData(`Just send us a message telling us what you want to order off of ` +
        `${producer.name} menu and we'll start preparing your order. For example: (${producer.exampleOrder})`);
      response.pushPostbackButton('Go Back', this._genPayload(actions.seeProducers));
    } catch (err) {
      throw new Error('Failed to create handle order message');
    }
    return [response];
  }

  /**
   *  Handles asking the consumer for suggestions
   * @param {Consumer} consumer: consumer object of the individual
   * @returns {Object} MessageData object
   * @private
   */
   async _handleProducerSuggestion(consumer) {
     const {context: {_id: contextId}} = consumer;
     await Context.updateFields(contextId, {lastAction: actions.suggestion});
     let response;
     try {
       response = new ButtonMessageData(`We are still adding more trucks everyday.` +
       ` Feel free to enter the name of the food truck you would like us to add! ^-^`);
       response.pushPostbackButton('See Trucks', this._genPayload(actions.seeProducers));
     } catch (err) {
       throw new Error('Failed to create handle suggestion button');
     }
     return [response];
   }

  /**
   * Handles suggestions and sends the response to slack
   * @param {Consumer} consumer: consumer object of the individual
   * @param {String} text: the text the consumer inputs
   * @returns {Object} MessageData object
   * @private
   */
  async _slackSuggestion(consumer, text) {
    const {context: {_id: contextId}} = consumer;
    await Context.emptyFields(contextId, ['lastAction']);
    const response = new ButtonMessageData('Thanks for your suggestion! We will try our best to add this truck.');
    response.pushPostbackButton('See Trucks', this._genPayload(actions.seeProducers)); // change this to something else
    const slackData = new TypedSlackData();
    slackData.pushAttachment();
    slackData.setFallback('Suggestion');
    slackData.pushField('Type', 'Suggestion');
    slackData.pushField('Text Body', text);
    await Slack.sendMessage(slackSuggestionChannelId, slackData);
    return [response];
  }

  /**
   * Executed when the consumer gives his/her location and displays
   * the closest producers
   *
   * @returns {Object}: GenericMessageData containing producers
   * @private
   */
  async _handleSeeProducers(consumer) {
    let text, response, producersWithAddresses;
    try {
      text = new TextMessageData(`Here is a list of food trucks that we currently support. Tap any of the buttons ` +
        `on the food trucks' cards to see their menu, place an order, or get more information.`);
      try {
        producersWithAddresses = await Consumer.getOrderedProducers(consumer.fbId, Constants.miles,
          Constants.multiplier, Constants.searchLimit, Constants.limit);
      } catch (err) {
        response = new ButtonMessageData('Sorry you are too far away. We could not find any trucks near you. :(' +
         '\n Please feel free to suggest a truck near you!');
        response.pushPostbackButton('Update Location', this._genPayload(actions.seeProducers));
        response.pushPostbackButton('Suggest a Truck', this._genPayload(actions.suggestionPrompt));
        return [response];
      }
      response = new GenericMessageData();
      const emptyProducers = producersWithAddresses.length === 0;
      if (emptyProducers) {
        text = new TextMessageData(`Sorry, we could not find any trucks near you that are open!` +
          ` Here are some trucks that you might enjoy, though.`);
        const producers = _.shuffle(await Producer.findRandomEnabled());
        // Populates the producers from findRandomEnabled() to get address
        for (let k = 0; k < producers.length; k++) {
          producers[k] = Producer.findOneByObjectId(producers[k]._id);
        }
        producersWithAddresses = await Promise.all(producers);
      }
      _.each(producersWithAddresses, producer => {
        const title = emptyProducers ? `${producer.name} (${producer.location.address})` :
          `${producer.name} (${producer.location.address}) - ${producer._distance} mi`;
        const description = `${producer.description} - ${Producer.isOpen(producer.hours) ? 'OPEN' : 'CLOSED'}`;
        response.pushElement(title, description, producer.profileImage);
        response.pushPostbackButton('View Menu', this._genPayload(actions.menu, {producerId: producer._id}));
        response.pushPostbackButton('More Info', this._genPayload(actions.moreInfo, {producerId: producer._id}));
        response.pushPostbackButton('Order Food', this._genPayload(actions.orderPrompt, {producerId: producer._id}));
      });
    } catch (err) {
      throw new Error('Failed to generate producers', err);
    }
    return message;
  }

  genResponse(optional = {consumerFbId: null, consumerMsgs: [], producerFbId: null, producerMsgs: []}) {
    const response = new FbMessage();
    const {consumerFbId, consumerMsgs, producerFbId, producerMsgs} = optional;

    if (consumerFbId && consumerMsgs.length > 0) {
      response.queueConsumerMessages(consumerFbId, consumerMsgs);
    }
    if (producerFbId && producerMsgs.length > 0) {
      response.queueProducerMessages(producerFbId, producerMsgs);
    }

    return response;
  }

  getEventType(event) {
    if (event.postback) {
      return FbChatBot.events.postback;
    }

    if (event.message && event.message.quick_reply) {
      return FbChatBot.events.quickReply;
    }

    /* Checking event.message.quick_reply here is redundant, but it's to make clear that
    * both text and quick reply events have text */
    if (event.message && event.message.text && !event.message.quick_reply) {
      return FbChatBot.events.text;
    }

    if (event.message && event.message.attachments) {
      return FbChatBot.events.attachment;
    }

    return null;
  }

  genPayload(action, data) {
    return JSON.stringify({action, data});
  }

  getAction(payload) {
    return payload.action;
  }

  getData(payload) {
    return payload.data;
  }

  formatPrice(price) {
    return (price / 100).toFixed(2);
  }

  /**
   * Validates the order's status against an input array of statuses
   *
   * @param {Order} order: order object we are comparing
   * @param {Array<String>} statuses: array of statuses we compare order against
   * @returns {boolean}: true if the order status is within the array and false otherwise
   */
  validOrderStatus(order, statuses) {
    return statuses.indexOf(order.status) !== -1;
  }
}
