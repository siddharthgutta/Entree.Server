import * as Consumer from '../../../api/controllers/consumer.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';

describe('Consumer DB API', () => {
  const fbId = 'The Id';

  const optionalAttributes = {
    consumer: {
      firstName: 'Jack',
      lastName: 'Bob',
      customerId: '123',
      receiptCount: 5
    }
  };

  beforeEach(async () => {
    await clear();
  });

  describe('#createFbConsumer()', () => {
    it('should create a basic Consumer object successfully', async () => {
      const consumer = await Consumer.createFbConsumer(fbId);
      assert.equal(consumer.fbId, fbId);
      assert.equal(consumer.receiptCount, 1);
      assert.ok(consumer.context);
    });

    it('should create a complex Consumer object successfully', async () => {
      const consumer = await Consumer.createFbConsumer(fbId, optionalAttributes);
      assert.equal(consumer.fbId, fbId);
      assert.equal(consumer.firstName, optionalAttributes.consumer.firstName);
      assert.equal(consumer.lastName, optionalAttributes.consumer.lastName);
      assert.equal(consumer.customerId, optionalAttributes.consumer.customerId);
      assert.equal(consumer.receiptCount, optionalAttributes.consumer.receiptCount);
      assert.ok(consumer.context);
    });

    it('should fail to create a complex Consumer object with a non-integer receipt count', async () => {
      try {
        await Consumer.createFbConsumer(fbId, {consumer: {receiptCount: 1.5}});
      } catch (err) {
        return;
      }
      assert(false);
    });
  });

  describe('#findOneByFbId()', () => {
    it('should find a consumer correctly', async () => {
      await Consumer.createFbConsumer(fbId, optionalAttributes);
      const consumer = await Consumer.findOneByFbId(fbId);
      assert.equal(consumer.fbId, fbId);
      assert.equal(consumer.firstName, optionalAttributes.consumer.firstName);
      assert.equal(consumer.lastName, optionalAttributes.consumer.lastName);
      assert.equal(consumer.customerId, optionalAttributes.consumer.customerId);
      assert.equal(consumer.receiptCount, optionalAttributes.consumer.receiptCount);
      assert.ok(consumer.context);
    });
  });

  describe('#setFieldsByFbId', () => {
    const updatedFields = {
      firstName: 'Jill',
      lastName: 'Jane',
      customerId: '456',
      receiptCount: 10
    };

    it('should set singular field of a consumer correctly', async () => {
      await Consumer.createFbConsumer(fbId, optionalAttributes);
      await Consumer.setFieldsByFbId(fbId, {firstName: updatedFields.firstName});
      const consumer = await Consumer.findOneByFbId(fbId);
      assert.equal(consumer.fbId, fbId);
      assert.equal(consumer.firstName, updatedFields.firstName);
      assert.equal(consumer.lastName, optionalAttributes.consumer.lastName);
      assert.equal(consumer.customerId, optionalAttributes.consumer.customerId);
      assert.equal(consumer.receiptCount, optionalAttributes.consumer.receiptCount);
      assert.ok(consumer.context);
    });

    it('should fail to set customerId of a consumer that is greater than 36 characters', async () => {
      await Consumer.createFbConsumer(fbId, optionalAttributes);
      try {
        await Consumer.setFieldsByFbId(fbId, {customerId: '1234567890123456789012345678901234567'});
      } catch (err) {
        return;
      }
      assert(false);
    });

    it('should fail to set customerId of a consumer that is an empty string', async () => {
      await Consumer.createFbConsumer(fbId, optionalAttributes);
      try {
        await Consumer.setFieldsByFbId(fbId, {customerId: ''});
      } catch (err) {
        return;
      }
      assert(false);
    });

    it('should set multiple fields of a consumer correctly', async () => {
      await Consumer.createFbConsumer(fbId, optionalAttributes);
      await Consumer.setFieldsByFbId(fbId, updatedFields);
      const consumer = await Consumer.findOneByFbId(fbId);
      assert.equal(consumer.fbId, fbId);
      assert.equal(consumer.firstName, updatedFields.firstName);
      assert.equal(consumer.lastName, updatedFields.lastName);
      assert.equal(consumer.customerId, updatedFields.customerId);
      assert.equal(consumer.receiptCount, updatedFields.receiptCount);
      assert.ok(consumer.context);
    });
  });

  describe('#incrementReceiptCounterByFbId', async () => {
    it('should increment the receipt counter of a default consumer correctly', async () => {
      let consumer = await Consumer.createFbConsumer(fbId);
      assert.equal(consumer.receiptCount, 1);
      await Consumer.incrementReceiptCounterByFbId(fbId);
      consumer = await Consumer.findOneByFbId(fbId);
      assert.equal(consumer.receiptCount, 2);
    });

    it('should increment the receipt counter of a created consumer correctly', async () => {
      await Consumer.createFbConsumer(fbId, optionalAttributes);
      await Consumer.incrementReceiptCounterByFbId(fbId);
      const consumer = await Consumer.findOneByFbId(fbId);
      assert.equal(consumer.receiptCount, optionalAttributes.consumer.receiptCount + 1);
    });
  });
});
