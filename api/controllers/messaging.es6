/**
 * Created by kfu on 4/13/16.
 */
import {FBMessenger} from '../../libs/msg/messenger.es6';
import config from 'config';
import * as Runtime from '../../libs/runtime.es6';
import Emitter, {Events} from '../events/index.es6';

let consumerMsgPlatform;
let producerMsgPlatform;

const productionOrStaging = Runtime.isProduction();
const allFacebookCreds = config.get(`Facebook`);
const branchName = Runtime.getBranch();

let consumerCreds;
let producerCreds;

if (Runtime.isStaging() && branchName in allFacebookCreds) {
  consumerCreds = allFacebookCreds[branchName].consumer;
  producerCreds = allFacebookCreds[branchName].merchant;
} else {
  consumerCreds = config.get('Facebook.consumer');
  producerCreds = config.get('Facebook.merchant');
}

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
