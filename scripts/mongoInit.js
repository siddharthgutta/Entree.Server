const mongo = new Mongo(); // eslint-disable-line no-undef

const entree = mongo.getDB('entree');
entree.dropUser('root');
entree.createUser({
  user: 'root',
  pwd: '123456',
  roles: [{role: 'userAdmin', db: 'entree'}]
});

const entreeTest = mongo.getDB('entree_test');
entreeTest.dropUser('root');
entreeTest.createUser({
  user: 'root',
  pwd: '123456',
  roles: [{role: 'userAdmin', db: 'entree_test'}]
});
