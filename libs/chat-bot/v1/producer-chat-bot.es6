/* Disabling lint rule since it doesn't make sense. */
/* eslint-disable babel/generator-star-spacing,one-var,valid-jsdoc */

import * as Producer from '../../../api/controllers/producer.es6';
import * as Context from '../../../api/controllers/context.es6';
import * as Order from '../../../api/controllers/order.es6';
import OrderStatuses from '../../../models/constants/order-status.es6';
import {TextMessageData, ButtonMessageData, CallToAction} from '../../msg/facebook/message-data.es6';
import {ProducerActions, ConsumerActions} from './actions.es6';
import FbChatBot from './fb-chat-bot.es6';

export default class ProducerChatBot extends FbChatBot {
  constructor(producerMsgPlatform) {
    super();

    this.producerMsgPlatform = producerMsgPlatform;

    // Sets the payload for the get started message
    this.producerMsgPlatform.setGetStartedButton(this.genPayload(ProducerActions.getStarted));

    // Sets up the persistent menu
    const callToActions = new CallToAction();
    callToActions.pushLinkButton('Entrée Website', `https://entreebot.com`);
    callToActions.pushPostbackButton('Pending Requests', this.genPayload(ProducerActions.pendingRequests));
    callToActions.pushPostbackButton('In Progress Orders', this.genPayload(ProducerActions.inProgressOrders));
    this.producerMsgPlatform.setPersistentMenu(callToActions.toJSON());

    // Sets the Greeting text
    this.producerMsgPlatform.setGreetingText('Entrée helps you sell more food!'); // TODO - change
  }

  /**
   * Processes the input event and creates response for producer
   *
   * @param {Object} event: input event from FB messenger
   * @returns {Object}: Messenger response to producer
   */
  async handleInput(event) {
    const sender = event.sender.id;
    let producer;
    try {
      producer = await Producer.findOneByFbId(sender);
    } catch (err) {
      const response = new TextMessageData('Sorry you are not a registered merchant with Entree.');
      return this.genResponse({producerFbId: sender, producerMsgs: [response]});
    }

    let output;
    // TODO - handle read receipt messages so it doens't clog up error logs
    switch (this.getEventType(event)) {
      case FbChatBot.events.postback:
        output = await this._handlePostback(event);
        break;
      case FbChatBot.events.text:
        output = await this._handleText(event, producer);
        break;
      case FbChatBot.events.delivery:
        // This is an event that just tells us our delivery succeeded
        // We already get this in the response of the message sent so generate empty response
        output = this.genResponse();
        break;
      default:
        throw Error(`Invalid event sent to producer bot: ${event}`);
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
    const payload = JSON.parse(event.postback.payload);
    const action = this.getAction(payload);
    const sender = event.sender.id;

    switch (action) {
      case ProducerActions.getStarted:
        return this._handleGetStarted(sender);
      case ProducerActions.quote:
        return await this._handleQuote(payload);
      case ProducerActions.decline:
        return await this._handleDecline(payload);
      case ProducerActions.accept:
        return await this._handleAccept(payload);
      case ProducerActions.ready:
        return await this._handleReady(payload);
      case ProducerActions.pendingRequests:
        return await this._handlePendingRequests(sender);
      case ProducerActions.inProgressOrders:
        return await this._handleInProgressOrders(sender);
      default:
        throw Error(`Invalid payload action: ${action}`);
    }
  }

  /**
   * Handles when producer wants to see all pending requests
   *
   * @param {String} fbId: fbId of the producer
   * @returns {[GenericMessageData]}: the list of pending order requests
   * @private
   */
  async _handlePendingRequests(fbId) {
    const producer = await Producer.findOneByFbId(fbId);
    const taskList = await this.generateTaskList(producer._id, [OrderStatuses.pending, OrderStatuses.requestQuote],
      FbChatBot.taskListLimit);
    return this.genResponse({producerFbId: fbId, producerMsgs: [taskList]});
  }

  /**
   * Handles when producer wants to see all in progress orders
   *
   * @param {String} fbId: fbId of the producer
   * @returns {[GenericMessageData]}: the list of in progress order requests
   * @private
   */
  async _handleInProgressOrders(fbId) {
    const producer = await Producer.findOneByFbId(fbId);
    const taskList = await this.generateTaskList(producer._id, [OrderStatuses.inProgress],
      FbChatBot.taskListLimit);
    return this.genResponse({producerFbId: fbId, producerMsgs: [taskList]});
  }

  /**
   * Handles when user taps get started button
   *
   * @param {String} sender: fbId of the producer who sent the message
   * @returns {[TextMessageData]}: text message data response
   * @private
   */
  _handleGetStarted(sender) {
    const response = new TextMessageData('Hello! Thanks for using Entree. We\'ll send you a messge when we have' +
      ' registered you with our platform and then you will start receiving orders');
    return this.genResponse({producerFbId: sender, producerMsgs: [response]});
  }

  /**
   * Handles when the producer hit the "Give Quote" postback
   *
   * @param {Object} payload: the message payload
   * @returns {[TextMessageData]}: text message data response
   * @private
   */
  async _handleQuote(payload) {
    const {orderId} = this.getData(payload);
    const order = await Order.findOneByObjectId(orderId, ['producer', 'consumer']);
    const {producer} = order;

    if (!this.validOrderStatus(order, [OrderStatuses.requestQuote])) {
      const text = this._invalidActionResponse('You have already given a quote for that order.' +
        ' Here is an updated list of your tasks.');
      const taskList = await this.generateTaskList(producer._id,
        [OrderStatuses.requestQuote, OrderStatuses.pending], FbChatBot.taskListLimit);
      return this.genResponse({producerFbId: producer.fbId, producerMsgs: [text, taskList]});
    }

    const {context: contextId} = producer;
    await Context.updateFields(contextId, {lastAction: ProducerActions.quote, order});

    const response = new TextMessageData(`Please type in the price of the order. For example, type \"15.42\" ` +
        `without the quotes for an order that costs $15.42 or \"15\" for an order that costs $15.00`);

    return this.genResponse({producerFbId: producer.fbId, producerMsgs: [response]});
  }

  /**
   * Handles when producer accepts an order that has been given a quote
   *
   * @param {Object} payload: the payload of the incoming message
   * @returns {[TextMessageData]}: text message data response
   * @private
   */
  async _handleAccept(payload) {
    const {orderId} = this.getData(payload);
    const order = await Order.findOneByObjectId(orderId, ['producer', 'consumer']);
    const {producer} = order;

    if (!this.validOrderStatus(order, [OrderStatuses.pending])) {
      const text = this._invalidActionResponse('You have already accepted or declined that order.' +
        ' Here is an updated list of your tasks.');
      const taskList = await this.generateTaskList(producer._id,
        [OrderStatuses.requestQuote, OrderStatuses.pending], FbChatBot.taskListLimit);
      return this.genResponse({producerFbId: producer.fbId, producerMsgs: [text, taskList]});
    }

    const {context: contextId} = producer;
    await Context.updateFields(contextId, {lastAction: ProducerActions.accept, order});

    const response = new TextMessageData(`Please type in the estimated time, in minutes, for the order to be ready.`);

    return this.genResponse({producerFbId: producer.fbId, producerMsgs: [response]});
  }

  /**
   * Handles when producer declines an order that has been given a quote
   *
   * @param {Object} payload: the payload of the incoming message
   * @returns {[TextMessageData]}: text message data response
   * @private
   */
  async _handleDecline(payload) {
    const {orderId} = this.getData(payload);
    const order = await Order.findOneByObjectId(orderId, ['producer', 'consumer']);
    const {producer} = order;

    if (!this.validOrderStatus(order, [OrderStatuses.pending, OrderStatuses.requestQuote])) {
      const text = this._invalidActionResponse('You have already accepted or declined that order.' +
        ' Here is an updated list of your tasks.');
      const taskList = await this.generateTaskList(producer._id,
        [OrderStatuses.requestQuote, OrderStatuses.pending], FbChatBot.taskListLimit);
      return this.genResponse({producerFbId: producer.fbId, producerMsgs: [text, taskList]});
    }

    const {context: contextId} = producer;
    await Context.updateFields(contextId, {lastAction: ProducerActions.decline, order});

    const response = new TextMessageData(`Please type in a message to let the user know why the order was declined.`);

    return this.genResponse({producerFbId: producer.fbId, producerMsgs: [response]});
  }

  /**
   * Handles when producer indicates that an order is ready to be picked up
   *
   * @param {Object} payload: the payload of the incoming message
   * @returns {[TextMessageData]}: text message data response
   * @private
   */
  async _handleReady(payload) {
    const {orderId} = this.getData(payload);
    const order = await Order.findOneByObjectId(orderId, ['producer', 'consumer']);
    const {producer, consumer} = order;

    if (!this.validOrderStatus(order, [OrderStatuses.inProgress])) {
      const text = this._invalidActionResponse('You have already completed that order.' +
        ' Here is an updated list of your in progess orders.');
      const taskList = await this.generateTaskList(producer._id,
        [OrderStatuses.inProgress], FbChatBot.taskListLimit);
      return this.genResponse({producerFbId: producer.fbId, producerMsgs: [text, taskList]});
    }

    await Order.updateByObjectId(order._id, {status: OrderStatuses.ready});

    const consumerMsg = new TextMessageData(`Your order \"${order.body}\" is ready to be picked up.`);
    const response = new TextMessageData('The user has been notified that his or her order is ready for pickup.');

    return this.genResponse({producerFbId: producer.fbId, producerMsgs: [response],
      consumerFbId: consumer.fbId, consumerMsgs: [consumerMsg]});
  }

  /**
   * Handles text events
   *
   * @param {Object} event: input event from messenger
   * @param {Producer} producer: producer that sent the event
   * @returns {Object}: messenger output
   */
  async _handleText(event, producer) {
    const {context} = producer;

    switch (context.lastAction) {
      case ProducerActions.quote:
        return await this._handleQuoteOrder(event, context);
      case ProducerActions.accept:
        return await this._handleOrderEta(event, context);
      case ProducerActions.decline:
        return await this._handleDeclineMessage(event, context);
      default:
        return this._handleInvalidText(event.message.text, event.sender.id);
    }
  }

  /**
   * Handles when producer gives a quote for the order
   *
   * @param {Object} event: input event from messenger
   * @param {Object} context: context for the producer
   * @returns {[TextMessageData]}: text message data response
   * @private
   */
  async _handleQuoteOrder(event, context) {
    const order = await Order.findOneByObjectId(context.order, ['producer', 'consumer']);
    const {producer, consumer} = order;

    let price;
    if (/^\d+\.\d{2}$/.test(event.message.text)) {
      price = Math.round(parseFloat(event.message.text) * 100);
    } else if (/^\d+$/.test(event.message.text)) {
      price = parseInt(event.message.text, 10) * 100;
    } else {
      const response = new TextMessageData('Please enter the correct price format (e.g. 15.42) for $15.42' +
        ' or 15 for $15.00');
      return this.genResponse({producerFbId: producer.fbId, producerMsgs: [response]});
    }

    /* Convert price to cents. The Math.round is here since JS does weird stuff with floating point
    *   If event.message.text is 2.22 and you multiple by 100, it will end up being 222.00000000000003*/
    await Order.updateByObjectId(order._id, {status: OrderStatuses.quoted, price});

    await Context.emptyFields(context._id, ['lastAction, order']);

    const response = new TextMessageData('We will notify you once the user decides to place the order.');
    const consumerMsg = this._requestUserConfirmation(order, price);
    return this.genResponse({producerFbId: producer.fbId, producerMsgs: [response],
      consumerFbId: consumer.fbId, consumerMsgs: [consumerMsg]});
  }

  /**
   * Requests a confirmation from the user for a given order price quote
   *
   * @param {Object} event: input event from messenger
   * @param {Number} price: the price of the quote
   * @private
   */
  _requestUserConfirmation(order, price) {
    const message = new ButtonMessageData(`Your order \"${order.body}\" will cost a total of` +
      ` $${this.formatPrice(price)}. Press \"Confim\" to place your order or \"Decline\" to decline and try again.`);
    message.pushPostbackButton('Confirm', this.genPayload(ConsumerActions.confirm, {orderId: order._id}));
    message.pushPostbackButton('Decline', this.genPayload(ConsumerActions.decline, {orderId: order._id}));

    return message;
  }

  /**
   * Handles when the producer officially accepts an order the user confirmed
   *
   * @param {Object} event: input event from messenger
   * @param {Object} context: context of the producer that sent the event
   * @returns {*[]}
   * @private
   */
  async _handleOrderEta(event, context) {
    const order = await Order.findOneByObjectId(context.order, ['producer', 'consumer']);

    const {producer, consumer} = order;
    if (!/^\d+$/.test(event.message.text)) {
      const response = new TextMessageData('Please enter the correct time format (e.g. 21 for 21 minutes)');
      return this.genResponse({producerFbId: producer.fbId, producerMsgs: [response]});
    }

    const eta = parseInt(event.message.text, 10);
    await Order.updateByObjectId(order._id, {eta, status: OrderStatuses.inProgress});


    await Context.emptyFields(context._id, ['lastAction, order']);
    const taskList = await this.generateTaskList(producer._id, [OrderStatuses.inProgress], FbChatBot.taskListLimit);
    const text = new TextMessageData('Here are the current orders in progress');

    const consumerMsg = this._orderAcceptToUser(order, eta);
    return this.genResponse({producerFbId: producer.fbId, producerMsgs: [text, taskList],
      consumerFbId: consumer.fbId, consumerMsgs: [consumerMsg]});
  }

  /**
   * Sends an order acceptance message to the user
   *
   * @param {Object} event: input event from messenger
   * @param {Number} eta: the eta until the order is ready
   * @private
   */
  _orderAcceptToUser(order, eta) {
    const message = new TextMessageData(`Your order \"${order.body}\" for a total of` +
      ` $${this.formatPrice(order.price)} has been accepted. It will be ready in ${eta} minutes.` +
      ` We'll send you a message once it's ready to be picked up.`);
    return message;
  }

  /**
   * Handles when the producer declines an order from the user
   *
   * @param {Object} event: input event from messenger
   * @param {Object} context: context of the producer that sent this message
   * @private
   */
  async _handleDeclineMessage(event, context) {
    const order = await Order.findOneByObjectId(context.order, ['producer', 'consumer']);
    await Order.updateByObjectId(order._id, {status: OrderStatuses.producerDeclined});
    await Context.emptyFields(context._id, ['lastAction, order']);

    const consumerMsg = new TextMessageData(`Your order \"${order.body}\" has been declined for the following ` +
        `reason: ${event.message.text}`);
    const response = new TextMessageData('We notified the user that his or her order has been declined.');

    const {consumer, producer} = order;
    return this.genResponse({producerFbId: producer.fbId, producerMsgs: [response],
      consumerFbId: consumer.fbId, consumerMsgs: [consumerMsg]});
  }

  /**
   * Handles and invalid text input
   *
   * @param {String} text: the input text
   * @param {String} sender: the fbId of the producer who sent the message
   * @returns {[ButtonMessageData]}: button message data for invalid text
   * @private
   */
  _handleInvalidText(text, sender) {
    const response = new TextMessageData(`Sorry, it looks like we don't know what do with your text \"${text}\"` +
      ` at this time. Please try again.`);
    return this.genResponse({producerFbId: sender, producerMsgs: [response]});
  }

  /**
   * Generates a text message data indicating that action isn't available
   *
   * @param {String} text: Customized error text for the response
   * @returns {TextMessageData}: response message
   * @private
   */
  _invalidActionResponse(text) {
    return new TextMessageData(`Sorry, that action is not available at this time. ${text}`);
  }
}
