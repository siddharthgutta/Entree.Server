import * as Producer from '../../../api/db/producer.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';

describe('Producer DB API', () => {
  const attributes = {
    name: 'Pizza Hut',
    password: 'password',
    phoneNumber: '1234567890',
    profileImage: 'www.image.com',
    enabled: true
  };

  beforeEach(async () => {
    await clear();
  });

  describe('#create()', () => {
    it('should create a Producer object successfully', async () => {
      const producer = await Producer.create(attributes);
      assert.equal(producer.name, attributes.name);
      assert.equal(producer.password, attributes.password);
      assert.equal(producer.phoneNumber, attributes.phoneNumber);
      assert.equal(producer.enabled, attributes.enabled);
    });

    it('should fail to create a Producer with no name', async () => {
      try {
        await Producer.create({
          password: 'password',
          phoneNumber: '1234567890',
          profileImage: 'www.image.com',
          enabled: true
        });
      } catch (e) {
        return;
      }

      assert(false);
    });

    it('should fail to create a Producer with no password', async () => {
      try {
        await Producer.create({
          name: 'Pizza Hut',
          phoneNumber: '1234567890',
          profileImage: 'www.image.com',
          enabled: true
        });
      } catch (e) {
        return;
      }

      assert(false);
    });

    it('should fail to create a Producer with no phoneNumber', async () => {
      try {
        await Producer.create({
          name: 'Pizza Hut',
          password: 'password',
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
        await Producer.create({
          name: 'Pizza Hut',
          password: 'password',
          phoneNumbre: '123456789',
          profileImage: 'www.image.com',
          enabled: true
        });
      } catch (e) {
        return;
      }

      assert(false);
    });
  });

  describe('#findOne()', () => {
    it('should find a producer correctly', async () => {
      await Producer.create(attributes);
      await Producer.create({
        name: 'Another One',
        password: 'password',
        phoneNumber: '1234567890',
        profileImage: 'www.image.com',
        enabled: true
      });

      const producer = await Producer.findOne({name: 'Pizza Hut'});

      assert.equal(producer.name, attributes.name);
      assert.equal(producer.password, attributes.password);
      assert.equal(producer.phoneNumber, attributes.phoneNumber);
      assert.equal(producer.enabled, attributes.enabled);
    });

    it('should return null if nothing is found', async () => {
      const producer = await Producer.findOne({name: 'Pizza Hut'});
      assert.equal(producer, null);
    });
  });
});
