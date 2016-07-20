/**
 * Created by kfu on 4/13/16.
 */

import {Router} from 'express';
import {ConsumerMsgPlatform} from '../api/controllers/messaging.es6';
import {FBMessenger} from '../libs/msg/messenger.es6';

const route = new Router();

if (ConsumerMsgPlatform instanceof FBMessenger) {
  route.use(ConsumerMsgPlatform.router());
}

export default route;
