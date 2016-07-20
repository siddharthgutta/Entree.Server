import {Router} from 'express';
import config from 'config';
import * as Runtime from '../libs/runtime.es6';

const route = new Router();
const clientConfig = JSON.stringify(config.get('Client'));

route.get('/', (req, res) => res.render('landing', {
  config: clientConfig,
  isStaging: Runtime.isStaging(),
  branch: Runtime.getBranch(),
  title: 'Entrée',
  description: `Stop Waiting... Start Eating`
}));

export default route;
