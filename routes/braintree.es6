/**
 * Created by kfu on 3/10/16.
 */

import {Router} from 'express';
import * as Payment from '../api/controllers/payment.es6';

const route = new Router();

/**
 * Payment Router
 * @type {Router}
 */
route.use(Payment.initRouter());

export default route;
