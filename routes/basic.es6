// Babel ES6/JSX Compiler
import 'babel-register';
import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom/server';
import {match, RoutingContext} from 'react-router';
import createLocation from 'history/lib/createLocation';
import reactRoutes from '../app/routes';
import {Router} from 'express';
import config from 'config';
import * as Runtime from '../libs/runtime.es6';

const route = new Router();
const clientConfig = JSON.stringify(config.get('Client'));

// React Middleware
route.use('*', (req, res, next) => {
  const location = createLocation(req.url);
  match({routes: reactRoutes, location}, (err, redirectLocation, renderProps) => {
    if (err) {
      res.status(500).send(err.message);
    } else if (redirectLocation) {
      res.status(302).redirect(redirectLocation.pathname + redirectLocation.search);
    } else if (renderProps) {
      const html = ReactDOM.renderToString(React.createElement(RoutingContext, renderProps));
      // Pass the generated HTML from React in middleware
      req.html = html;
      next();
    } else {
      res.status(404).send('Page Not Found');
    }
  });
});

route.get('/', (req, res) => {
  res.render('landing', {
    config: clientConfig,
    isStaging: Runtime.isStaging(),
    branch: Runtime.getBranch(),
    title: 'Entrée',
    html: req.html
  });
});

export default route;
