/* Disabling lint rule since it doesn't make sense. */
/* eslint-disable babel/generator-star-spacing,one-var,valid-jsdoc */

import _ from 'lodash';
import * as Order from '../../../api/controllers/order.es6';
import {GenericMessageData, TextMessageData} from '../../msg/facebook/message-data.es6';
import {ProducerActions} from './actions.es6';
import OrderStatuses from '../../../models/constants/order-status.es6';
import FbMessage from './fb-message.es6';
import Moment from 'moment';

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
      return new TextMessageData('You do not have any orders of this kind right now.');
    }

    const message = new GenericMessageData();
    _.forEach(orders, order => {
      const {consumer} = order;
      const date = new Moment(order.createdAt);
      // TODO HERE!!! FORMAT THE DATE SO IT LOOKS NICE AND I"M JUst testing that the rest of the bot works
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

    if (event.message && event.message.text) {
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
}
