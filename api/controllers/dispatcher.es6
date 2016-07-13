/* eslint-disable */
import * as Producer from './producer.es6';
import Emitter, {Events} from '../events/index.es6';
import {ConsumerChatBot, ProducerChatBot} from '../../libs/chat-bot/index.es6';
import {ConsumerMsgPlatform, ProducerMsgPlatform} from './messaging.es6';

const consumerChatBot = new ConsumerChatBot(ConsumerMsgPlatform);
const producerChatBot = new ProducerChatBot(ProducerMsgPlatform);

/**
 * Dispatcher to handle system events
 */

Emitter.on(Events.CONSUMER_MSG_RECEIVED, async event => {
  try {
    console.log(event);

    const fbMessage = await consumerChatBot.handleInput(event);
    await fbMessage.sendMessages(ConsumerMsgPlatform, ProducerMsgPlatform);

  } catch (err) {
    // TODO - should notify slack of error so we can investigate
    console.error(err.stack);
  }
});

Emitter.on(Events.PRODUCER_MSG_RECEIVED, async event => {
  try {
    console.log(event);

    const fbMessage = await producerChatBot.handleInput(event);
    await fbMessage.sendMessages(ConsumerMsgPlatform, ProducerMsgPlatform);

  } catch (err) {
    // TODO - should notify slack of error so we can investigate
    console.error(err.stack);
  }
});
