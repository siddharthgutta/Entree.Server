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
      assert.deepEqual(user.username, 'navsaini');
      assert.notEqual(user.password, 'nav1996');
      assert.deepEqual(user.email, 'nav1996@gmail.com');
    });

    it('should not allow duplicate usernames', async () => {
      await User.create('navsaini', 'nav1966', {email: 'nav1996@gmail.com'});
      try {
        await User.create('navsaini', 'nav1967', {email: 'nav1997@gmail.com'});
      } catch (createErr) {
        return;
      }
      assert(false, 'Duplicate usernames should fail validation');
    });

    it('should encrypt the passwords differently even though the passwords are the same', async () => {
      const user1 = await User.create('jessemao', 'nav1996', {email: 'jlmao@gmail.com'});
      const user2 = await User.create('navsaini', 'nav1996', {email: 'nav1996@gmail.com'});
      assert.notDeepEqual(user1.password, user2.password);
    });
  });

  describe('#findByUsername()', () => {
    it('should find a user correctly', async () => {
      await User.create('kimchi', 'mike');
      const user = await User.findByUsername('kimchi');

      assert.deepEqual(user.username, 'kimchi');
      assert.notDeepEqual(user.password, 'mike');
    });

    it('should fail to find a user if no user exists', async () => {
      try {
        await User.findByUsername('kimchi');
      } catch (err) {
        return;
      }
      assert(false);
    });
  });

  describe('#findOneById()', () => {
    it('should find a user correctly', async () => {
      const {_id} = await User.create('songla', 'taiwan');
      const user = await User.findOneById(_id);

      assert.deepEqual(user.username, 'songla');
    });

    it('should fail to find a user if user does not exist', async () => {
      try {
        await User.findOneById('kimchi');
      } catch (err) {
        return;
      }
      assert(false);
    });
  });

  describe('#comparePassword()', () => {
    const password = 'taiwan';
    it('should compare passwords correctly', async () => {
      const {_id} = await User.create('songla', password);
      const user = await User.findOneById(_id);
      assert(await User.comparePassword(password, user.password));
    });

    it('should fail to compare incorrect passwords correctly', async () => {
      const {_id} = await User.create('songla', password);
      const user = await User.findOneById(_id);
      assert(!(await User.comparePassword('incorrectPass', user.password)));
    });
  });

  describe('#updateByObjectId()', () => {
    const password = 'taiwan';
    const updatedUsername = 'wtf';
    const updatedPassword = 'bbq';
    it('should update username correctly', async () => {
      const {_id} = await User.create('songla', password);
      const user = await User.updateByObjectId(_id, {username: updatedUsername});
      assert.deepEqual(user.username, updatedUsername);
    });

    it('should update password with salt/hash correctly', async () => {
      const {_id} = await User.create('songla', password);
      const user = await User.updateByObjectId(_id, {password: updatedPassword});
      assert(await User.comparePassword(updatedPassword, user.password));
    });

    it('should update both username and password correctly', async () => {
      const {_id} = await User.create('songla', password);
      const user = await User.updateByObjectId(_id, {username: updatedUsername, password: updatedPassword});
      assert.deepEqual(user.username, updatedUsername);
      assert(await User.comparePassword(updatedPassword, user.password));
    });
  });
});
