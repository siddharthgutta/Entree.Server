import * as Consumer from '../../../api/db/consumer.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';

describe('Consumer DB API', () => {
  const attributes = {
    fbId: 'The Id',
    customerId: '123',
    receiptCount: 1
  };

  beforeEach(async () => {
    await clear();
  });

  describe('#create()', () => {
    it('should create a Consumer object successfully', async () => {
      const consumer = await Consumer.create(attributes);

      assert.equal(consumer.fbId, attributes.fbId);
      assert.equal(consumer.customerId, attributes.customerId);
      assert.equal(consumer.receiptCount, attributes.receiptCount);
    });

    it('should fail to create a Consumer with no fbId', async () => {
      try {
        await Consumer.create({
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
      await Consumer.create(attributes);
      await Consumer.create({
        fbId: 'Someone Else',
        customerId: 'Another Id',
        receiptCount: 1
      });

      const consumer = await Consumer.findOne({fbId: attributes.fbId});

      assert.equal(consumer.fbId, attributes.fbId);
      assert.equal(consumer.customerId, attributes.customerId);
      assert.equal(consumer.receiptCount, attributes.receiptCount);
    });

    it('should return null if nothing is found', async () => {
      try {
        await Consumer.findOne({fbId: attributes.fbId});
      } catch (err) {
        return;
      }
      assert(false);
    });
  });
});
