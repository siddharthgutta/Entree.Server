/**
 * Created by kfu on 6/18/16.
 */

import config from 'config';
import * as Runtime from './libs/runtime.es6';

export function initServer() {
  const port = Runtime.getPort();

  require('./server.es6').default.listen(port,
    () => console.log(`Server deployed on port:${port}`));
}
