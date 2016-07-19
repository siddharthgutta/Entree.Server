// Babel ES6/JSX Compiler
import 'babel-register';
import 'babel-polyfill';

import {Router} from 'express';
import config from 'config';
import * as Runtime from '../libs/runtime.es6';

const route = new Router();
const clientConfig = JSON.stringify(config.get('Client'));

route.get('/', (req, res) => {
  res.render('index', {
    config: clientConfig,
    isStaging: Runtime.isStaging(),
    branch: Runtime.getBranch(),
    title: 'Entrée',
    html: req.html
  });
});

export default route;
