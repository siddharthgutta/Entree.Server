/**
 * Created by kfu on 4/13/16.
 */
import {FBMessenger} from '../../libs/msg/messenger.es6';
import config from 'config';
import * as Runtime from '../../libs/runtime.es6';
import Emitter, {Events} from '../events/index.es6';

let consumerMsgPlatform;
let producerMsgPlatform;
let consumerCreds;
let producerCreds;

const productionOrStaging = Runtime.isProduction();
const allFacebookCreds = config.get('Facebook');
const branchName = Runtime.getBranch();

if (Runtime.isStaging() && branchName in allFacebookCreds) {
  consumerCreds = allFacebookCreds[branchName].consumer;
  producerCreds = allFacebookCreds[branchName].producer;
} else {
  consumerCreds = config.get('Facebook.consumer');
  producerCreds = config.get('Facebook.producer');
}

consumerMsgPlatform = new FBMessenger(consumerCreds.pageAccessToken, consumerCreds.verificationToken,
  consumerCreds.pageId, productionOrStaging);
producerMsgPlatform = new FBMessenger(producerCreds.pageAccessToken, producerCreds.verificationToken,
  producerCreds.pageId, productionOrStaging);

console.info(`Initialized FB Messenger using ${Runtime.getEnv()} Credentials`);

consumerMsgPlatform.on(FBMessenger.RECEIVED, async event => {
  console.log('Received FBMessenger consumer message in messaging.es6');
  Emitter.emit(Events.CONSUMER_MSG_RECEIVED, event);
});

producerMsgPlatform.on(FBMessenger.RECEIVED, async event => {
  console.log('Received FBMessenger producer message in messaging.es6');
  Emitter.emit(Events.PRODUCER_MSG_RECEIVED, event);
});


/**
 * MsgPlatform strategy
 * @type {MsgPlatform}
 */
export {consumerMsgPlatform as ConsumerMsgPlatform};
export {producerMsgPlatform as ProducerMsgPlatform};
