/**
 * Created by kfu on 6/18/16.
 */

import * as Runtime from './libs/runtime.es6';

export function initServer() {
  const port = Runtime.getPort();

  require('./server.es6').default.listen(port,
    () => console.log(`Deployed on port:${port}`));
}
