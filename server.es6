/**
 * Created by kfu on 6/18/16.
 */

import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import https from 'https';
import http from 'http';
import config from 'config';
import compression from 'compression';
import * as fs from 'fs';
import FBMessengerRouter from './routes/fb-messenger.es6';

const app = express();
const ssl = {
  key: fs.readFileSync(config.get('Server.sslKey')),
  cert: fs.readFileSync(config.get('Server.sslCert')),
  ca: fs.readFileSync(config.get('Server.sslCa')),
  rejectUnauthorized: config.get('Server.httpsRejectUnauthorized')
};

const server = config.get('Server.protocol') === 'https' ? https.createServer(ssl, app) : http.createServer(app);

app.set('views', path.join(__dirname, 'views'));  // points app to location of the views
app.set('view engine', 'jade');                   // sets the view engine to jade

// compress gzip
app.use(compression());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // points app to public directory for static files

// Sets up specific routes
app.use('/fbmessenger', FBMessengerRouter);

export default server;
