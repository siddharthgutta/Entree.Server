/**
 * Created by kfu on 4/13/16.
 */
import {FBMessenger} from '../../libs/msg/messenger.es6';
import config from 'config';
import * as Runtime from '../../libs/runtime.es6';
import Emitter, {Events} from '../events/index.es6';

let consumerMsgPlatform, producerMsgPlatform;

const productionOrStaging = Runtime.isProduction();

const consumerCreds = config.get('Facebook.consumer');
const producerCreds = config.get('Facebook.producer');

consumerMsgPlatform = new FBMessenger(consumerCreds.pageAccessToken, consumerCreds.verificationToken,
  consumerCreds.pageId, productionOrStaging);
producerMsgPlatform = new FBMessenger(producerCreds.pageAccessToken, producerCreds.verificationToken,
  producerCreds.pageId, productionOrStaging);

console.info(`Initialized FB Messenger using ${Runtime.getEnv()} Credentials`);

consumerMsgPlatform.on(FBMessenger.RECEIVED, async event => {
  console.log('Received FBMessenger message in messaging.es6');
  Emitter.emit(Events.MSG_RECEIVED, event);
});

producerMsgPlatform.on(FBMessenger.RECEIVED, async event => {
  console.log('Received FBMessenger message in messaging.es6');
  Emitter.emit(Events.MSG_RECEIVED, event);
});


/**
 * MsgPlatform strategy
 * @type {MsgPlatform}
 */
export const ConsumerMsgPlatform = consumerMsgPlatform;
