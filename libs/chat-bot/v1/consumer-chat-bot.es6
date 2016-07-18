/* Disabling lint rule since it doesn't make sense. */
/* eslint-disable babel/generator-star-spacing,one-var,valid-jsdoc */

import _ from 'lodash';
import * as Producer from '../../../api/controllers/producer.es6';
import * as Consumer from '../../../api/controllers/consumer.es6';
import * as Context from '../../../api/controllers/context.es6';
import * as Order from '../../../api/controllers/order.es6';
import {GenericMessageData, TextMessageData, ButtonMessageData,
  ImageAttachmentMessageData, QuickReplyMessageData, CallToAction} from '../../msg/facebook/message-data.es6';
import {ConsumerActions} from './actions.es6';
import TypedSlackData from '../../notifier/typed-slack-data.es6';
import * as Slack from '../../../api/controllers/slack.es6';
import config from 'config';
import * as Runtime from '../../runtime.es6';
import OrderStatuses from '../../../models/constants/order-status.es6';
import FbChatBot from './fb-chat-bot.es6';
import moment from 'moment';
import * as Google from '../../../api/controllers/google.es6';
import * as Utils from '../../utils.es6';
import * as Hour from '../../hour.es6';
import Constants from './constants.es6';

const slackChannelId = config.get('Slack.orders.channelId');

export default class ConsumerChatBot extends FbChatBot {
  constructor(consumerMsgPlatform) {
    super();

    this.consumerMsgPlatform = consumerMsgPlatform;

    // Sets the payload for the get started message
    this.consumerMsgPlatform.setGetStartedButton(this.genPayload(ConsumerActions.getStarted));

    // Sets up the persistent menu
    const callToActions = new CallToAction();
    callToActions.pushLinkButton('Entrée Website', `https://entreebot.com`);
    // callToActions.pushLinkButton('Help', `https://entreebot.com`);
    // callToActions.pushLinkButton('Request a Truck ', `https://entreebot.com`);
    // callToActions.pushLinkButton('Contact', `https://entreebot.com`);
    // callToActions.pushLinkButton('Update My Location', `https://entreebot.com`);
    callToActions.pushPostbackButton('See Trucks', this.genPayload(ConsumerActions.seeProducers));
    callToActions.pushPostbackButton('Update My Location', this.genPayload(ConsumerActions.updateLocation));
    this.consumerMsgPlatform.setPersistentMenu(callToActions.toJSON());


    // Sets the Greeting text
    this.consumerMsgPlatform.setGreetingText('Entrée helps you find and order ahead from the best food trucks ' +
      'around you.');
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
    switch (this.getEventType(event)) {
      case FbChatBot.events.postback:
        output = await this._handlePostback(event, consumer);
        break;
      case FbChatBot.events.quickReply:
        output = await this._handleQuickReply(event, consumer);
        break;
      case FbChatBot.events.text:
        output = await this._handleText(event, consumer);
        break;
      case FbChatBot.events.attachment:
        output = await this._handleAttachment(event, consumer);
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
    const payload = JSON.parse(event.message.quick_reply.payload);
    const action = this.getAction(payload);

    switch (action) {
      case ConsumerActions.android:
        return this._handleAndroid(consumer);
      case ConsumerActions.ios:
        return this._handleios(consumer);
      case ConsumerActions.desktop:
        return this._handleDesktop(consumer);
      case ConsumerActions.existingLocation:
        return this._handleSeeProducers(consumer);
      case ConsumerActions.newLocation:
        return this._handleWhichPlatform(consumer);
      default:
        throw Error('Invalid quick reply payload action');
    }
  }

  /**
   * Handles postback events
   *
   * @param {Object} event: input event from messenger
   * @param {Consumer} consumer: consumer object from database
   * @returns {Object}: messenger output
   */
  async _handlePostback(event, consumer) {
    const payload = JSON.parse(event.postback.payload);
    const action = this.getAction(payload);

    switch (action) {
      case ConsumerActions.getStarted:
        return this._handleGetStarted(consumer);
      case ConsumerActions.seeProducers:
        return this._handleExistingLocationPrompt(consumer);
      case ConsumerActions.updateLocation:
        return this._handleWhichPlatform(consumer);
      case ConsumerActions.moreInfo:
        return await this._handleMoreInfo(payload, consumer);
      case ConsumerActions.menu:
        return await this._handleMenu(payload, consumer);
      case ConsumerActions.orderPrompt:
        return await this._handleOrderPrompt(payload, consumer);
      case ConsumerActions.confirm:
        return await this._handleOrderConfirmation(payload, consumer);
      case ConsumerActions.decline:
        return await this._handleOrderDecline(payload, consumer);
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
      case ConsumerActions.location:
        try {
          await this._updateConsumerLocation(event, consumer);
        } catch (err) {
          const response = new TextMessageData('We could not find a location from that address. Please try again.');
          return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [response]});
        }
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
  }
  /**
   * Handles text events
   *
   * @param {Object} event: input event from messenger
   * @param {Consumer} consumer: consumer that sent the event
   * @returns {Object}: messenger output
   */
  async _handleText(event, consumer) {
    const text = event.message.text;
    const {context} = consumer;

    switch (context.lastAction) {
      case ConsumerActions.order:
        return this._handleOrder(text, consumer);
      case ConsumerActions.location:
        await this._updateConsumerLocation(event, consumer);
        return await this._handleSeeProducers(consumer);
      default:
        return this._handleInvalidText(text, consumer);
    }
  }

  /**
   * Handles the get started button being pressed
   *
   * @param {Consumer} consumer: consumer object from database
   * @returns {Object}: FbMessage object containing response messages
   * @private
   */
  _handleGetStarted(consumer) {
    const button = new ButtonMessageData(`Hello! I'm Entrée, a personal assistant designed to help you order ` +
      `food ahead for pick-up at food trucks. With just a few taps, clicks, or messages you can order food faster ` +
      `and easier than ever! Tap the "Show Trucks" button below to see a selection of food trucks you can order ` +
      `ahead from.`);
    button.pushPostbackButton('Trucks', this.genPayload(ConsumerActions.seeProducers));
    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [button]});
  }

  /**
   * Handle the menu actions by sending menu link image
   *
   * @param {Object} payload: payload passed from postback button
   * @param {Consumer} consumer: consumer object from database
   * @returns {Object}: FbMessage object containing response messages
   */
  async _handleMenu(payload, consumer) {
    const {producerId} = this.getData(payload);
    const producer = await Producer.findOneByObjectId(producerId);
    const image = new ImageAttachmentMessageData(producer.menuLink);
    const button = new ButtonMessageData(`Here is the ${producer.name} menu. Tap the image to see it full screen ` +
      `or choose one of the following options.`);
    button.pushPostbackButton('More Info', this.genPayload(ConsumerActions.moreInfo, {producerId: producer._id}));
    button.pushPostbackButton('Order Food', this.genPayload(ConsumerActions.orderPrompt, {producerId: producer._id}));
    button.pushPostbackButton('See Trucks', this.genPayload(ConsumerActions.seeProducers));

    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [image, button]});
  }

  /**
   * Handle when the user accepts the quote given by the producer
   *
   * @param {Object} payload: payload passed from postback button
   * @param {Consumer} consumer: consumer object from database
   * @returns {Object}: FbMessage object containing response messages
   * @private
   */
  async _handleOrderConfirmation(payload, consumer) {
    // TODO - make it so user cannot confirm order twice
    const {orderId} = this.getData(payload);
    await Order.updateByObjectId(orderId, {status: OrderStatuses.pending});
    const producer = (await Order.findOneByObjectId(orderId, ['consumer', 'producer'])).producer;

    const response = new TextMessageData('Your order has been sent to the merchant. We\'ll message you when your ' +
      'order has been accepted.');
    const producerText = new TextMessageData('Here are your pending requests.');
    const taskList = await this.generateTaskList(producer._id, [OrderStatuses.pending, OrderStatuses.requestQuote],
      FbChatBot.taskListLimit);

    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [response],
      producerFbId: producer.fbId, producerMsgs: [producerText, taskList]});
  }

  /**
   * When the user declines the quote given by the producer
   *
   * @param {Object} payload: payload passed from postback button
   * @param {Consumer} consumer: consumer object from database
   * @returns {Object}: FbMessage object containing response messages
   * @private
   */
  async _handleOrderDecline(payload, consumer) {
    const {orderId} = this.getData(payload);
    await Order.updateByObjectId(orderId, {status: OrderStatuses.consumerQuoteDeclined});

    const button = new ButtonMessageData('You have successfully cancelled the order. To browse more trucks, press ' +
      '\"See Trucks\"');
    button.pushPostbackButton('See Trucks', this.genPayload(ConsumerActions.seeProducers));

    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [button]});
  }

  /**
   * Handle the order text sent by the consumer
   *
   * @param {String} text: text of the order sent by the consumer
   * @param {Consumer} consumer: consumer object of the consumer in the database
   * @returns {Object}: FbMessage object containing response messages
   * @private
   */
  async _handleOrder(text, consumer) {
    const {_id: consumerId, context: {_id: contextId, producer: producerId}} = consumer;
    console.log(`Handle Order ${JSON.stringify(consumer)}`);

    const order = await Order.create(text, producerId, consumerId);
    const producer = await Producer.findOneByObjectId(producerId);
    if (!(Producer.isOpen(producer.hours))) {
      return this._hoursClosed(producer, consumer);
    }

    await Order.pushOrderByObjectId([consumer, producer], order._id);
    await Context.emptyFields(contextId, ['producer', 'lastAction']);

    await this._sendOrderMessage(consumer, producer, order);

    const response = new ButtonMessageData('Your order has been sent. The truck should respond with the price soon!');
    response.pushPostbackButton('See Other Trucks', this.genPayload(ConsumerActions.seeProducers));
    const producerText = new TextMessageData('Here are your pending requests.');
    const taskList = await this.generateTaskList(producerId, [OrderStatuses.pending, OrderStatuses.requestQuote],
      FbChatBot.taskListLimit);

    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [response],
      producerFbId: producer.fbId, producerMsgs: [producerText, taskList]});
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
    const response = await Slack.sendMessage(slackChannelId, slackData);
    console.log(response);
  }

  /**
   * Handles and invalid text input
   *
   * @param {String} text: the input text
   * @param {Consumer} consumer: consumer object of the individual to respond to
   * @returns {Object}: FbMessage object containing response messages
   * @private
   */
  _handleInvalidText(text, consumer) {
    const response = new ButtonMessageData(`Sorry, it looks like we don't know what do with your text \"${text}\" at ` +
      `this time. Please start over by pressing the \"Trucks\" button. If you were trying to look up trucks ` +
      `in a different location, press "Update My Location" to update your location.`);
    response.pushPostbackButton('Trucks', this.genPayload(ConsumerActions.seeProducers));
    response.pushPostbackButton('Update My Location', this.genPayload(ConsumerActions.updateLocation));
    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [response]});
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
   * @param {Consumer} consumer: the consumer to respond to
   * @returns {Object} ButtonMessage object
   * @private
   */
  _hoursClosed(producer, consumer) {
    let response;
    const day = moment();
    const tmrw = day.add(1, 'day').format('dddd');
    const today = this._getHoursForADay(producer.hours, moment().format('dddd'));
    const tomorrow = this._getHoursForADay(producer.hours, tmrw);
    response = new ButtonMessageData(`Sorry ${producer.name} is currently closed.\n` +
      `Today's Hours: ${today}\nTomorrow's Hours: ${tomorrow}`);
    response.pushPostbackButton('Go Back', this.genPayload(ConsumerActions.seeProducers));
    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [response]});
  }

  /**
   * Handles the order prompting
   *
   * @param {Object} payload: payload of the incoming postback message
   * @param {Consumer} consumer: consumer object of the individual to respond to
   * @returns {Object}: FbMessage object containing response messages
   * @private
   */
  async _handleOrderPrompt(payload, consumer) {
    const {producerId} = this.getData(payload);
    const producer = await Producer.findOneByObjectId(producerId);
    const {context: {_id: contextId}} = consumer;
    await Context.updateFields(contextId, {lastAction: ConsumerActions.order, producer: producer._id});
    const response = new ButtonMessageData(`Just send us a message telling us what you want to order off of ` +
      `${producer.name} menu and we'll start preparing your order. For example: (${producer.exampleOrder})`);
    response.pushPostbackButton('Go Back', this.genPayload(ConsumerActions.seeProducers));

    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [response]});
  }

  /**
   * Executed when the consumer gives his/her location and displays
   * the closest producers
   *
   * @returns {Object}: GenericMessageData containing producers
   * @private
   */
  async _handleSeeProducers(consumer) {
    let text = new TextMessageData(`Here is a list of food trucks that we currently support. Tap any of the buttons ` +
      `on the food trucks' cards to see their menu, place an order, or get more information.`);
    let producersWithAddresses = await Consumer.getOrderedProducers(consumer.fbId,
      Constants.miles, Constants.searchLimit);

    const response = new GenericMessageData();
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
      response.pushPostbackButton('View Menu', this.genPayload(ConsumerActions.menu, {producerId: producer._id}));
      response.pushPostbackButton('More Info', this.genPayload(ConsumerActions.moreInfo, {producerId: producer._id}));
      response.pushPostbackButton('Order Food', this.genPayload(ConsumerActions.orderPrompt,
        {producerId: producer._id}));
    });

    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [text, response]});
  }

  /**
   * Formats the hours to display for a producer
   * @param {Array} hours: an array of hours to traverse and format
   * @returns {string} the formatted hours for the producer
   * @private
   */
  _formatHours(hours) {
    const openHours = [];
    const arr = Hour.hourDict(hours);
    _.forEach(arr, bucket => {
      const hourArr = [];
      const day = moment(bucket[0].day, 'dddd').format('ddd');
      _.forEach(bucket, hour => {
        hourArr.push(Hour.format(hour));
      });
      openHours.push(`${day}: ${hourArr.join(', ')}`);
    });
    return `${openHours.join('\n')}`;
  }

  /**
   * Executed after user asks to see trucks and asks if user wants to use previous location for search
   *
   * @returns {Object}: Quick reply button containing options 'yes' and 'no'
   * @private
   */
  async _handleExistingLocationPrompt(consumer) {
    if (Utils.isEmpty(consumer.defaultLocation)) return this._handleWhichPlatform(consumer);
    const response = new QuickReplyMessageData('Do you want us to use the last location you gave us to ' +
      'find trucks near you?');
    response.pushQuickReply('Yes', this.genPayload(ConsumerActions.existingLocation));
    response.pushQuickReply('No', this.genPayload(ConsumerActions.newLocation));

    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [response]});
  }

  async _handleWhichPlatform(consumer) {
    const response = new QuickReplyMessageData(`Which platform are you using?`);
    response.pushQuickReply('Android', this.genPayload(ConsumerActions.android));
    response.pushQuickReply('iOS', this.genPayload(ConsumerActions.ios));
    response.pushQuickReply('Desktop', this.genPayload(ConsumerActions.desktop));

    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [response]});
  }

  async _handleAndroid(consumer) {
    const text = new TextMessageData('We need your location to find food trucks near you. ' +
      'click the \'…\' button, press \'Location\', and then press the send button');
    const {context: {_id: contextId}} = consumer;
    await Context.updateFields(contextId, {lastAction: ConsumerActions.location});

    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [text]});
  }

  async _handleios(consumer) {
    const text = new TextMessageData('We need your location to find food trucks near you. ' +
      'Tap the location button to send us your location!');
    const {context: {_id: contextId}} = consumer;
    await Context.updateFields(contextId, {lastAction: ConsumerActions.location});

    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [text]});
  }

  async _handleDesktop(consumer) {
    const text = new TextMessageData('We need your location to find food trucks near you. ' +
      'Type in your address (Ex. 201 E 21st St, Austin, TX). Please be sure to include your city or ' +
      'your zipcode along with the street address.');
    const {context: {_id: contextId}} = consumer;
    await Context.updateFields(contextId, {lastAction: ConsumerActions.location});

    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [text]});
  }

  /**
   * Executed when producer presses the MoreInfo button on a specific producer searched
   *
   * @param {Object} payload: Producer tht was searched
   * @param {Consumer} consumer: Consumer that requested more info
   * @returns {Object}: Buttons and more text information on the producer
   * @private
   */
  async _handleMoreInfo(payload, consumer) {
    const {producerId} = this.getData(payload);
    const producer = await Producer.findOneByObjectId(producerId);
    const hoursString = this._formatHours(producer.hours);
    const openString = ` is currently ${(Producer.isOpen(producer.hours) ? 'open! :D' : 'closed. :(')}`;
    // TODO Google Maps Insert Location Information Here
    // TODO fix the format string rip
    const button = new ButtonMessageData(`Here is more information about ${producer.name}.` +
      `\n${producer.name}${openString}\n\nHours:\n${hoursString}`);
    button.pushLinkButton('Location', `https://maps.google.com/?q=${producer.location.address}`);
    button.pushPostbackButton('Order Food', this.genPayload(ConsumerActions.orderPrompt, {producerId: producer._id}));
    button.pushPostbackButton('See Other Trucks', this.genPayload(ConsumerActions.seeProducers));

    return this.genResponse({consumerFbId: consumer.fbId, consumerMsgs: [button]});
  }

  /**
   * Updates a consumer's location
   *
   * @param {Object} event: input event from messenger
   * @returns {Object}: messenger output
   */
  async _updateConsumerLocation(event, consumer) {
    const inputText = event.message.text;
    if (!Utils.isEmpty(inputText)) { /* In this case the input is an address */
      try {
        const {lat, lng} = await Google.getLocationCoordinatesFromAddress(inputText);
        await Consumer.addLocation(consumer.fbId, lat, lng);
      } catch (err) {
        throw new Error('Could not generate location from that address');
      }
    } else { /* In this case the input is a location attachment sent from mobile */
      let lat, long;
      try {
        const {payload: {coordinates}} = event.message.attachments[0];
        lat = coordinates.lat;
        long = coordinates.long;
        await Consumer.addLocation(consumer.fbId, lat, long);
      } catch (err) {
        throw new Error(`Could not generate location from coordinates: ${lat}, ${long}`);
      }
    }
    const {context: {_id: contextId}} = consumer;
    await Context.emptyFields(contextId, ['lastAction']);
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
      // TODO - this makes the logs cluttered
      console.log(`Found Consumer: ${consumer}`);
    } catch (err) {
      const profile = await this.consumerMsgPlatform.getFacebookProfileInfo(sender);
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
}
