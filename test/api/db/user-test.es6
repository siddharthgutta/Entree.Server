import * as User from '../../../api/db/user.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';

describe('User DB API', () => {
  const attributes = {
    fbId: 'The Id',
    customerId: '123',
    receiptCount: 1
  };

  beforeEach(async () => {
    await clear();
  });

  describe('#create()', () => {
    it('should create a User object successfully', async () => {
      const user = await User.create(attributes);

      assert.equal(user.fbId, attributes.fbId);
      assert.equal(user.customerId, attributes.customerId);
      assert.equal(user.receiptCount, attributes.receiptCount);
    });

    it('should fail to create a User with no fbId', async () => {
      try {
        await User.create({
          customerId: '123',
          receiptCount: 1
        });
      } catch (e) {
        return;
      }

      assert(false);
    });
  });

  describe('#findOne()', () => {
    it('should find a producer correctly', async () => {
      await User.create(attributes);
      await User.create({
        fbId: 'Someone Else',
        customerId: 'Another Id',
        receiptCount: 1
      });

      const user = await User.findOne({fbId: attributes.fbId});

      assert.equal(user.fbId, attributes.fbId);
      assert.equal(user.customerId, attributes.customerId);
      assert.equal(user.receiptCount, attributes.receiptCount);
    });

    it('should return null if nothing is found', async () => {
      const user = await User.findOne({fbId: attributes.fbId});
      assert.equal(user, null);
    });
  });
});
