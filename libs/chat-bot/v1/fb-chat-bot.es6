/* Disabling lint rule since it doesn't make sense. */
/* eslint-disable babel/generator-star-spacing,one-var,valid-jsdoc */

import _ from 'lodash';
import * as Order from '../../../api/controllers/order.es6';
import {GenericMessageData, TextMessageData} from '../../msg/facebook/message-data.es6';
import {ProducerActions} from './actions.es6';
import OrderStatuses from '../../../models/constants/order-status.es6';
import FbMessage from './fb-message.es6';
import moment from 'moment';

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
    }

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
   * Executed when the consumer gives his/her location and displays
   * the closest producers
   *
   * @returns {Object}: GenericMessageData containing producers
   * @private
   */
  async _handleSeeProducers(consumer) {
    let text, response;
    try {
      text = new TextMessageData(`Here is a list of food trucks that we currently support. Tap any of the buttons ` +
        `on the food trucks' cards to see their menu, place an order, or get more information.`);
      let producersWithAddresses = await Consumer.getOrderedProducers(consumer.fbId, Constants.miles,
        Constants.multiplier, Constants.searchLimit, Constants.limit);
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
