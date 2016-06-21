import {Router} from 'express';
import * as Runtime from '../libs/runtime.es6';

const route = new Router();

route.get('/', (req, res) =>
  res.send('DEPLOYED')
);

export default route;
