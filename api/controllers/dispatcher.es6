/* eslint-disable */
import Emitter, {Events} from '../events/index.es6';
import {FbChatBot} from '../../libs/chat-bot/index.es6';
import {ConsumerMsgPlatform} from './messaging.es6';

const fbChatBot = new FbChatBot(ConsumerMsgPlatform);

/**
 * Dispatcher to handle system events
 */

Emitter.on(Events.CONSUMER_MSG_RECEIVED, async event => {
  try {
    console.log(event);

    const responses = await fbChatBot.handleInput(event);
    const sender = event.sender.id;

    for (let index in responses) {
      const message = responses[index].toJSON();
      await ConsumerMsgPlatform.sendMessageToId(sender, message);
    }
  } catch (err) {
    console.error(err);
    console.error(event);
  }
});

