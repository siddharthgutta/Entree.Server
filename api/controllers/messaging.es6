/**
 * Created by kfu on 4/13/16.
 */
import {FBMessenger} from '../../libs/msg/messenger.es6';
import config from 'config';
import * as Runtime from '../../libs/runtime.es6';
import Emitter, {Events} from '../events/index.es6';

let msgPlatform;

const productionOrStaging = Runtime.isProduction();

let facebookCreds;
if (Runtime.isLocal()) {
  facebookCreds = config.get(`Facebook.production`);
} else {
  facebookCreds = config.get(`Facebook.${Runtime.getEnv()}`);
}

msgPlatform = new FBMessenger(facebookCreds.pageAccessToken, facebookCreds.verificationToken,
  facebookCreds.pageId, productionOrStaging);

console.info(`Initialized FB Messenger using ${Runtime.getEnv()} Credentials`);

msgPlatform.on(FBMessenger.RECEIVED, async event => {
  Emitter.emit(Events.MSG_RECEIVED, event);
});


/**
 * MsgPlatform strategy
 * @type {MsgPlatform}
 */
export const MsgPlatform = msgPlatform;
