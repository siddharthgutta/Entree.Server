import {Router} from 'express';
import config from 'config';

const route = new Router();
const clientConfig = JSON.stringify(config.get('Client'));

route.get('/', (req, res) => res.render('landing', {
  config: clientConfig,
  title: 'Entrée',
  description: `Stop Waiting... Start Eating`
}));

export default route;
