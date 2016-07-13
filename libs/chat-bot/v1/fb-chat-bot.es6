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
    delivery: 'Delivery',
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
      } else if (order.status === OrderStatuses.cooking) {
        message.pushElement(`In progress order from ${consumer.firstName} ${consumer.lastName} at` +
          ` ${date.format(FbChatBot.formatString)}`, `Order: ${order.body}`);
        message.pushPostbackButton('Ready', this.genPayload(ProducerActions.ready, {orderId: order._id}));
      }
    });

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

    if (event.delivery) {
      return FbChatBot.events.delivery;
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
