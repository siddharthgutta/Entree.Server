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

    it('should create a default disabled Producer object successfully', async () => {
      const producer = await Producer._create(name, password, description, {phoneNumber, profileImage});
      assert.equal(producer.name, name);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.enabled, false);
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

  describe('#findFbEnabled', async () => {
    const name2 = 'Dominos';
    const username2 = 'dominos';
    const password2 = 'password';
    const description2 = 'some dominos description';
    const phoneNumber2 = '2345678901';
    const profileImage2 = 'www.anothaimage.com';
    const enabled2 = false;
    const menuLink2 = 'www.somemenulink.com';

    const name3 = 'mcdonalds';
    const username3 = 'mcdonalds';
    const password3 = 'bigmac';
    const description3 = 'some mcdonalds description';
    const profileImage3 = 'www.anothaoneimage.com';
    const enabled3 = true;

    it('should find a singular enabled producer', async () => {
      const {_id: id1} = await Producer._create(name, username, password, description,
        profileImage, {phoneNumber, enabled, menuLink});
      const {_id: id2} = await Producer._create(name2, username2, password2, description2,
        profileImage2, {phoneNumber2, enabled2, menuLink2});
      assert.notDeepEqual(id1, id2);
      const producers = await Producer.findFbEnabled();
      assert.equal(producers.length, 1);
      assert.deepEqual(producers[0]._id, id1);
    });

    it('should find multiple enabled producers', async () => {
      const {_id: id1} = await Producer._create(name, username, password, description,
        profileImage, {phoneNumber, enabled, menuLink});
      const {_id: id2} = await Producer._create(name2, username2, password2, description2,
        profileImage2, {phoneNumber: phoneNumber2, enabled: enabled2, menuLink: menuLink2});
      const {_id: id3} = await Producer._create(name3, username3, password3, description3,
        profileImage3, {enabled: enabled3});
      assert.notDeepEqual(id1, id2);
      assert.notDeepEqual(id2, id3);
      assert.notDeepEqual(id1, id3);
      const producers = await Producer.findFbEnabled();
      assert.equal(producers.length, 2);
      assert.deepEqual(producers[0]._id, id1);
      assert.deepEqual(producers[1]._id, id3);
    });

    it('should limit the sample size of producers found', async() => {
      const {_id: id1} = await Producer._create(name, username, password, description,
        profileImage, {phoneNumber, enabled, menuLink});
      const {_id: id2} = await Producer._create(name2, username2, password2, description2,
        profileImage2, {phoneNumber: phoneNumber2, enabled: enabled2, menuLink: menuLink2});
      const {_id: id3} = await Producer._create(name3, username3, password3, description3,
        profileImage3, {enabled: enabled3});
      assert.notDeepEqual(id1, id2);
      assert.notDeepEqual(id2, id3);
      assert.notDeepEqual(id1, id3);
      const producers = await Producer._find({}, 1, ['merchant']);
      assert.equal(producers.length, 1);
      assert.deepEqual(producers[0]._id, id1);
    });
  });

  describe('#updateByObjectId', () => {
    const fields = {
      name: 'Updated Name',
      password: 'Updated Password',
      description: 'Updated Description',
      phoneNumber: '9876543210',
      profileImage: 'www.updated.com',
      enabled: true
    };

    it('should update a producer correctly', async () => {
      const {_id} = await Producer._create(name, password, description);
      await Producer.updateByObjectId(_id, fields);
      const producer = await Producer.findOneByObjectId(_id);
      assert.equal(producer.name, fields.name);
      assert.equal(producer.password, fields.password);
      assert.equal(producer.description, fields.description);
      assert.equal(producer.phoneNumber, fields.phoneNumber);
      assert.equal(producer.profileImage, fields.profileImage);
      assert.equal(producer.enabled, fields.enabled);
    });

    it('should not update a producer if phoneNumber is invalid', async () => {
      const {_id} = await Producer._create(name, password, description);
      try {
        await Producer.updateByObjectId(_id, {phoneNumber: '123456789'});
      } catch (err) {
        return;
      }
      assert(false);
    });
  });
});
