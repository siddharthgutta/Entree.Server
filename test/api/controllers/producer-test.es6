import * as Producer from '../../../api/controllers/producer.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';
import mongoose from 'mongoose';

describe('Producer DB API', () => {
  const name = 'Pizza Hut';
  const username = 'pizzahut';
  const password = 'password';
  const description = 'some description';
  const phoneNumber = '1234567890';
  const profileImage = 'www.image.com';
  const enabled = true;
  const menuLink = 'www.menulink.com';

  beforeEach(async () => {
    await clear();
  });

  describe('#_create()', () => {
    it('should create a Producer object successfully', async () => {
      const producer = await Producer._create(name, username, password, description,
                                              profileImage, {phoneNumber, enabled, menuLink});
      assert.equal(producer.name, name);
      assert.equal(producer.username, username);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.profileImage, profileImage);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.enabled, enabled);
      assert.equal(producer.menuLink, menuLink);
    });

    it('should create a default disabled Producer object successfully', async () => {
      const producer = await Producer._create(name, username, password, description,
                                              profileImage, {phoneNumber, profileImage, menuLink});
      assert.equal(producer.name, name);
      assert.equal(producer.username, username);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.profileImage, profileImage);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.enabled, false);
      assert.equal(producer.menuLink, menuLink);
    });

    it('should fail to create a Producer with no name', async () => {
      try {
        await Producer._create(null, username, password, description, profileImage, {
          phoneNumber: '1234567890', enabled: true, menuLink
        });
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no username', async () => {
      try {
        await Producer._create(name, null, password, description, profileImage, {
          phoneNumber: '1234567890', enabled: true, menuLink
        });
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no description', async () => {
      try {
        await Producer._create('Pizza Hut', username, null, 'password', 'www.image.com', {
          phoneNumber: '1234567890',
          enabled: true,
          menuLink
        });
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no password', async () => {
      try {
        await Producer._create('Pizza Hut', username, 'some description', null, 'www.image.com', {
          phoneNumber: '1234567890',
          enabled: true,
          menuLink
        });
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no profileImage', async () => {
      try {
        await Producer._create('Pizza Hut', username, 'some description', 'password', null, {
          phoneNumber: '1234567890',
          enabled: true,
          menuLink
        });
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with non 10 digit phone number', async () => {
      try {
        await Producer._create('Pizza Hut', username, 'password', 'some description', 'www.image.com', {
          phoneNumber: '123456789',
          enabled: true,
          menuLink
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
          enabled,
          menuLink
        },
        merchant: {
          merchantId
        }
      };
      const {_id} = await Producer.create(name, username, password, description,
                                          profileImage, percentageFee, transactionFee, optional);
      const producer = await Producer.findOneByObjectId(_id);
      assert.equal(producer.name, name);
      assert.equal(producer.username, username);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.phoneNumber, optional.producer.phoneNumber);
      assert.equal(producer.profileImage, profileImage);
      assert.equal(producer.enabled, optional.producer.enabled);
      assert.equal(producer.menuLink, menuLink);
      assert.equal(producer.merchant.percentageFee, percentageFee);
      assert.equal(producer.merchant.transactionFee, transactionFee);
      assert.equal(producer.merchant.merchantId, merchantId);
    });
  });

  describe('#findOneByObjectId()', () => {
    it('should find a producer correctly', async () => {
      const {_id} = await Producer._create(name, username, password, description,
                                           profileImage, {phoneNumber, enabled, menuLink});

      const producer = await Producer.findOneByObjectId(_id);

      assert.equal(producer.name, name);
      assert.equal(producer.username, username);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.profileImage, profileImage);
      assert.equal(producer.enabled, enabled);
      assert.equal(producer.menuLink, menuLink);
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

  describe('#updateByObjectId', () => {
    const fields = {
      name: 'Updated Name',
      username: 'Updated Username',
      password: 'Updated Password',
      description: 'Updated Description',
      phoneNumber: '9876543210',
      profileImage: 'www.updated.com',
      enabled: true,
      menuLink: 'www.menulink.com'
    };

    it('should update a producer correctly', async () => {
      const {_id} = await Producer._create(name, username, password, description, profileImage);
      await Producer.updateByObjectId(_id, fields);
      const producer = await Producer.findOneByObjectId(_id);
      assert.equal(producer.name, fields.name);
      assert.equal(producer.username, fields.username);
      assert.equal(producer.password, fields.password);
      assert.equal(producer.description, fields.description);
      assert.equal(producer.phoneNumber, fields.phoneNumber);
      assert.equal(producer.profileImage, fields.profileImage);
      assert.equal(producer.enabled, fields.enabled);
      assert.equal(producer.menuLink, fields.menuLink);
    });

    it('should not update a producer if phoneNumber is invalid', async () => {
      const {_id} = await Producer._create(name, username, password, description, profileImage);
      try {
        await Producer.updateByObjectId(_id, {phoneNumber: '123456789'});
      } catch (err) {
        return;
      }
      assert(false);
    });
  });
});
