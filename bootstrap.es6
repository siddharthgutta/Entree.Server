/**
 * Created by kfu on 6/18/16.
 */

import config from 'config';
import Promise from 'bluebird';
import fs from 'fs';
import https from 'https';

export function initServer() {
  const port = config.get('Server.port');

  require('./server.es6').default.listen(port,
    () => console.tag('server').log(`Listening on ${port}`));
}
