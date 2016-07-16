import * as User from '../../../api/controllers/user.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';

describe('User DB API', () => {
  beforeEach(async () => {
    await clear();
  });

  describe('#create()', () => {
    it('should register a user with hashed password', async () => {
      const user = await User.create('navsaini', 'nav1996', {email: 'nav1996@gmail.com'});

      assert.equal(user.username, 'navsaini');
      assert.notEqual(user.password, 'nav1996');
      assert.equal(user.email, 'nav1996@gmail.com');
    });
    it('should encrypt the passwords differently even though the passwords are the same', async () => {
      const user1 = await User.create('jessemao', 'nav1996', {email: 'jlmao@gmail.com'});
      const user2 = await User.create('navsaini', 'nav1996', {email: 'nav1996@gmail.com'});

      assert.notEqual(user1.password, user2.password);
    });
  });

  describe('#findByUsername()', () => {
    it('should find a user correctly', async () => {
      await User.create('kimchi', 'mike');
      const user = await User.findByUsername('kimchi');

      assert.equal(user.username, 'kimchi');
      assert.notEqual(user.password, 'mike');
    });
    it('should fail to find a user', async () => {
      try {
        await User.findByUsername('kimchi');
      } catch (err) {
        return;
      }
      assert(false);
    });
  });

  describe('#findById()', () => {
    it('should find a user correctly', async () => {
      const {_id} = await User.create('songla', 'taiwan');
      const user = await User.findById(_id);

      assert.equal(user.username, 'songla');
    });
    it('should fail to find a user', async () => {
      try {
        await User.findById('kimchi');
      } catch (err) {
        return;
      }
      assert(false);
    });
  });
});
