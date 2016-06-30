/**
 * Created by kfu on 4/13/16.
 */

import {Router} from 'express';
import {ConsumerMsgPlatform, ProducerMsgPlatform} from '../api/controllers/messaging.es6';
import {FBMessenger} from '../libs/msg/messenger.es6';

const consumerRouter = new Router();
const producerRouter = new Router();

if (ConsumerMsgPlatform instanceof FBMessenger) {
  consumerRouter.use(ConsumerMsgPlatform.router());
}

if (ProducerMsgPlatform instanceof FBMessenger) {
  producerRouter.use(ProducerMsgPlatform.router());
}

export {consumerRouter as ConsumerRouter, producerRouter as ProducerRouter};
