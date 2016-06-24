import * as Producer from '../../../api/controllers/producer.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';
import mongoose from 'mongoose';

describe('Producer DB API', () => {
  const name = 'Pizza Hut';
  const password = 'password';
  const description = 'some description';
  const phoneNumber = '1234567890';
  const profileImage = 'www.image.com';
  const enabled = true;

  beforeEach(async () => {
    await clear();
  });

  describe('#_create()', () => {
    it('should create a Producer object successfully', async () => {
      const producer = await Producer._create(name, password, description, {phoneNumber, profileImage, enabled});
      assert.equal(producer.name, name);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.enabled, enabled);
    });

    it('should fail to create a Producer with no name', async () => {
      try {
        await Producer._create(null, password, description, {
          phoneNumber: '1234567890', profileImage: 'www.image.com', enabled: true
        });
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no password', async () => {
      try {
        await Producer._create('Pizza Hut', 'some description', null, {
          phoneNumber: '1234567890',
          profileImage: 'www.image.com',
          enabled: true
        });
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no description', async () => {
      try {
        await Producer._create('Pizza Hut', null, 'password', {
          phoneNumber: '1234567890',
          profileImage: 'www.image.com',
          enabled: true
        });
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with non 10 digit phone number', async () => {
      try {
        await Producer._create('Pizza Hut', 'password', 'some description', {
          phoneNumber: '123456789',
          profileImage: 'www.image.com',
          enabled: true
        });
      } catch (e) {
        return;
      }
      assert(false);
    });
  });

  describe('#create()', () => {
    it('should create a producer with merchant correctly', async () => {
      const percentageFee = 12.5;
      const transactionFee = 30;
      const merchantId = 'abcdef';
      const optional = {
        producer: {
          phoneNumber,
          profileImage,
          enabled
        },
        merchant: {
          merchantId
        }
      };
      const {_id} = await Producer.create(name, password, description, percentageFee, transactionFee, optional);
      const producer = await Producer.findOneByObjectId(_id);
      assert.equal(producer.name, name);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.phoneNumber, optional.producer.phoneNumber);
      assert.equal(producer.profileImage, optional.producer.profileImage);
      assert.equal(producer.enabled, optional.producer.enabled);
      assert.equal(producer.merchant.percentageFee, percentageFee);
      assert.equal(producer.merchant.transactionFee, transactionFee);
      assert.equal(producer.merchant.merchantId, merchantId);
    });
  });

  describe('#findOneByObjectId()', () => {
    it('should find a producer correctly', async () => {
      const {_id} = await Producer._create(name, password, description, {phoneNumber, profileImage, enabled});

      const producer = await Producer.findOneByObjectId(_id);

      assert.equal(producer.name, name);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.profileImage, profileImage);
      assert.equal(producer.enabled, enabled);
    });

    it('should return null if nothing is found', async () => {
      try {
        await Producer.findOneByObjectId(mongoose.Schema.Types.ObjectId()); // eslint-disable-line
      } catch (err) {
        return;
      }
      assert(false);
    });
  });
});
