/* eslint-disable */
import Emitter, {Events} from '../events/index.es6';
import {FbChatBot} from '../../libs/chat-bot/index.es6';
import {MsgPlatform} from './messaging.es6';

const fbChatBot = new FbChatBot(MsgPlatform);

/**
 * Dispatcher to handle system events
 */

Emitter.on(Events.MSG_RECEIVED, async event => {
  try {
    console.tag('api', 'controllers', 'dispatcher', 'MSG_RECEIVED').log(event);

    const responses = await fbChatBot.handleInput(event);
    const sender = event.sender.id;

    for (let index in responses) {
      const message = responses[index].toJSON();
      await MsgPlatform.sendMessageToId(sender, message);
    }
  } catch (err) {
    console.tag('api', 'controllers', 'dispatcher', 'MSG_RECEIVED', 'ERROR').error(err);
    console.tag('api', 'controllers', 'dispatcher', 'MSG_RECEIVED', 'EVENT').error(event);
  }
});

