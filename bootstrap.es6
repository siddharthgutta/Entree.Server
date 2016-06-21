/**
 * Created by kfu on 6/18/16.
 */

import config from 'config';

export function initServer() {
  const port = config.get('Server.port');

  require('./server.es6').default.listen(port,
    () => console.log(`Server deployed on port:${port}`));
}
