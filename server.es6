/**
 * Created by kfu on 6/18/16.
 */
import './api/controllers/dispatcher.es6';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import https from 'https';
import http from 'http';
import config from 'config';
import morgan from 'morgan';
import compression from 'compression';
import passport from 'passport';
import session from 'express-session';
import * as fs from 'fs';
import {ConsumerRouter, ProducerRouter} from './routes/fb-messenger.es6';
import BasicRouter from './routes/basic.es6';
import * as Runtime from './libs/runtime.es6';
import forceSSL from 'express-force-ssl';
import BraintreeRouter from './routes/braintree.es6';
import LoginRouter from './routes/login.es6';
import RegisterRouter from './routes/register.es6';

import React from 'react';
import ReactDOM from 'react-dom/server';
import {match, RoutingContext} from 'react-router';
import createLocation from 'history/lib/createLocation';
import reactRoutes from './app/routes';

let server;
const app = express();

const isHTTPS = config.get('Server.protocol') === 'https';

if (isHTTPS) {
  // If production, redirect http port 80 to https port 443
  if (Runtime.isProduction()) {
    const httpServer = http.createServer(app);
    app.use(forceSSL);
    httpServer.listen(80);
    console.log('Forcing HTTP to HTTPS Redirect...');
  }
  const ssl = {
    key: fs.readFileSync(config.get('Server.sslKey')),
    cert: fs.readFileSync(config.get('Server.sslCert')),
    ca: fs.readFileSync(config.get('Server.sslCa')),
    passphrase: config.get('Server.sslPassphrase'),
    rejectUnauthorized: config.get('Server.httpsRejectUnauthorized')
  };
  server = https.createServer(ssl, app);
} else {
  server = http.createServer(app);
}

console.log(`SSL: ${isHTTPS}`);

app.set('views', path.join(__dirname, 'views'));  // points app to location of the views
app.set('view engine', 'jade');                   // sets the view engine to jade

// compress gzip
app.use(compression());

app.use(morgan('combined'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // points app to public directory for static files
app.use(cookieParser());
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  secure: isHTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('*', (req, res, next) => {
  const location = createLocation(req.url);
  match({routes: reactRoutes, location}, (err, redirectLocation, renderProps) => {
    if (err) {
      res.status(500).send(err.message);
    } else if (redirectLocation) {
      res.status(302).redirect(redirectLocation.pathname + redirectLocation.search);
    } else if (renderProps) {
      // Pass the generated HTML from React in middleware
      const html = ReactDOM.renderToString(React.createElement(RoutingContext, renderProps));
      req.html = html;
      next();
    } else {
      res.status(404).send('Page Not Found');
    }
  });
});

// Sets up specific routes
app.use('/', BasicRouter);
app.use('/braintree', BraintreeRouter);
app.use('/consumer-messenger', ConsumerRouter);
app.use('/producer-messenger', ProducerRouter);
app.use('/login', LoginRouter);
app.use('/register', RegisterRouter);

export default server;
