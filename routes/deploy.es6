import {Router} from 'express';

const route = new Router();

route.get('/', (req, res) =>
  res.send('DEPLOYED')
);

export default route;
