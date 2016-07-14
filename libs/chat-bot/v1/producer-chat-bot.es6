/* Disabling lint rule since it doesn't make sense. */
/* eslint-disable babel/generator-star-spacing,one-var,valid-jsdoc */

import * as Producer from '../../../api/controllers/producer.es6';
import * as Context from '../../../api/controllers/context.es6';
import * as Order from '../../../api/controllers/order.es6';
import OrderStatuses from '../../../models/constants/order-status.es6';
import {TextMessageData, ButtonMessageData, CallToAction,
  QuickReplyMessageData} from '../../msg/facebook/message-data.es6';
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
    switch (this.getEventType(event)) {
      case FbChatBot.events.postback:
        output = await this._handlePostback(event);
        break;
      case FbChatBot.events.text:
        output = await this._handleText(event, producer);
        break;
      case FbChatBot.events.quickReply:
        output = await this._handleQuickReply(event, producer);
        break;
      default:
        throw Error(`Invalid event sent to producer bot: ${event}`);
    }

    return output;
  }

  /**
   * Handles quick reply events
   *
   * @param {Object} event: input event from messenger
   * @param {Producer} producer: producer associated with this event
   * @returns {Object}: messenger output
   */
  async _handleQuickReply(event, producer) {
    const payload = JSON.parse(event.message.quick_reply.payload);
    const action = this.getAction(payload);
    const {context} = producer;

    switch (action) {
      case ProducerActions.setEta:
        return this._handleQuickReplyEta(payload, context);
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
   * Handles when the producer responds to setting the order eta with a quick reply
   *
   * @param {Object} payload: data of the quick reply button
   * @param {Context} context: context of the producer
   * @returns {Object}: FbMessage object containing response messages
   * @private
   */
  async _handleQuickReplyEta(payload, context) {
    const {eta, orderId} = this.getData(payload);
    await Order.updateByObjectId(orderId, {eta, status: OrderStatuses.inProgress});
    const order = await Order.findOneByObjectId(orderId, ['consumer', 'producer']);

    return await this._orderEtaHelper(context, eta, order);
  }

  /**
   * Handles when producer wants to see all pending requests
   *
   * @param {String} fbId: fbId of the producer
   * @returns {Object}: FbMessage object containing response messages
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
   * @returns {Object}: FbMessage object containing response messages
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
   * @returns {Object}: FbMessage object containing response messages
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
   * @returns {Object}: FbMessage object containing response messages
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
   * @returns {Object}: FbMessage object containing response messages
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
    const quickReply = new QuickReplyMessageData('Please tap a button or type in the estimated time, in minutes,' +
      ' for the order to be ready.');
    quickReply.pushQuickReply('5', this.genPayload(ProducerActions.setEta, {eta: 5, orderId: order._id}));
    quickReply.pushQuickReply('10', this.genPayload(ProducerActions.setEta, {eta: 10, orderId: order._id}));
    quickReply.pushQuickReply('15', this.genPayload(ProducerActions.setEta, {eta: 15, orderId: order._id}));
    quickReply.pushQuickReply('30', this.genPayload(ProducerActions.setEta, {eta: 30, orderId: order._id}));
    quickReply.pushQuickReply('45', this.genPayload(ProducerActions.setEta, {eta: 45, orderId: order._id}));
    quickReply.pushQuickReply('60', this.genPayload(ProducerActions.setEta, {eta: 60, orderId: order._id}));

    return this.genResponse({producerFbId: producer.fbId, producerMsgs: [quickReply]});
  }

  /**
   * Handles when producer declines an order that has been given a quote
   *
   * @param {Object} payload: the payload of the incoming message
   * @returns {Object}: FbMessage object containing response messages
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
   * @returns {Object}: FbMessage object containing response messages
   * @private
   */
  async _handleReady(payload) {
    const {orderId} = this.getData(payload);
    const order = await Order.findOneByObjectId(orderId, ['producer', 'consumer']);
    const {producer, consumer} = order;
    const {location} = await Producer.findOneByObjectId(producer._id);

    if (!this.validOrderStatus(order, [OrderStatuses.inProgress])) {
      const text = this._invalidActionResponse('You have already completed that order.' +
        ' Here is an updated list of your in progess orders.');
      const taskList = await this.generateTaskList(producer._id,
        [OrderStatuses.inProgress], FbChatBot.taskListLimit);
      return this.genResponse({producerFbId: producer.fbId, producerMsgs: [text, taskList]});
    }

    await Order.updateByObjectId(order._id, {status: OrderStatuses.ready});

    const consumerMsg = new ButtonMessageData(`Your order \"${order.body}\" is ready to be picked up.`);
    consumerMsg.pushLinkButton('Location', `https://maps.google.com/?q=${location.address}`);
    const response = new TextMessageData('The user has been notified that his or her order is ready for pickup.');

    return this.genResponse({producerFbId: producer.fbId, producerMsgs: [response],
      consumerFbId: consumer.fbId, consumerMsgs: [consumerMsg]});
  }

  /**
   * Handles text events
   *
   * @param {Object} event: input event from messenger
   * @param {Producer} producer: producer that sent the event
   * @returns {Object}: FbMessage object containing response messages
   */
  async _handleText(event, producer) {
    const {context} = producer;

    switch (context.lastAction) {
      case ProducerActions.quote:
        return await this._handleQuoteOrder(event, context);
      case ProducerActions.accept:
        return await this._handleTextEta(event, context);
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
   * @returns {Object}: FbMessage object containing response messages
   * @private
   */
  async _handleQuoteOrder(event, context) {
    const order = await Order.findOneByObjectId(context.order, ['producer', 'consumer']);
    const {producer, consumer} = order;

    let price;
    if (/^\d+(\.\d{2})?$/.test(event.message.text)) {
      price = Math.round(parseFloat(event.message.text) * 100);
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
   * @returns {Object}: FbMessage object containing response messages
   * @private
   */
  async _handleTextEta(event, context) {
    const order = await Order.findOneByObjectId(context.order, ['producer', 'consumer']);

    const {producer} = order;
    if (!/^\d+$/.test(event.message.text)) {
      const response = new TextMessageData('Please enter the correct time format (e.g. 21 for 21 minutes)');
      return this.genResponse({producerFbId: producer.fbId, producerMsgs: [response]});
    }

    const eta = parseInt(event.message.text, 10);
    await Order.updateByObjectId(order._id, {eta, status: OrderStatuses.inProgress});

    return await this._orderEtaHelper(context, eta, order);
  }

  /**
   *
   * @param {Object} context: context for producer that is setting the eta
   * @param {Number} eta: the eta of the order
   * @param {Order} order: the order object
   * @returns {Object}: FbMessage object containing response messages
   * @private
   */
  async _orderEtaHelper(context, eta, order) {
    const {consumer, producer} = order;
    const {location} = await Producer.findOneByObjectId(producer._id);

    await Context.emptyFields(context._id, ['lastAction, order']);

    const text = new TextMessageData('Here are the current orders in progress');
    const taskList = await this.generateTaskList(producer._id, [OrderStatuses.inProgress], FbChatBot.taskListLimit);

    const consumerMsg = new ButtonMessageData(`Your order \"${order.body}\" for a total of` +
      ` $${this.formatPrice(order.price)} has been accepted. It will be ready in ${eta} minutes.` +
      ` We'll send you a message once it's ready to be picked up.`);
    consumerMsg.pushLinkButton('Location', `https://maps.google.com/?q=${location.address}`);

    return this.genResponse({producerFbId: producer.fbId, producerMsgs: [text, taskList],
      consumerFbId: consumer.fbId, consumerMsgs: [consumerMsg]});
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

    const {consumer, producer} = order;
    const consumerMsg = new ButtonMessageData(`Your order \"${order.body}\" has been declined by ${producer.name}` +
      ` for the following reason: ${event.message.text}`);
    consumerMsg.pushPostbackButton('See Trucks', this.genPayload(ConsumerActions.seeProducers));
    const response = new TextMessageData('We notified the user that his or her order has been declined.');

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
