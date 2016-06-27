import * as Producer from '../../../api/controllers/producer.es6';
import * as Location from '../../../api/controllers/location.es6';
import * as Merchant from '../../../api/controllers/merchant.es6';

import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';
import mongoose from 'mongoose';

describe('Producer DB API', () => {
  const name = 'Pizza Hut';
  const username = 'pizzahut';
  const password = 'password';
  const description = 'some description';
  const address = '1811 Guadalupe St, 78705';
  const phoneNumber = '1234567890';
  const profileImage = 'www.image.com';
  const exampleOrder = 'This is an example order';
  const enabled = true;
  const menuLink = 'www.menulink.com';
  const percentageFee = 12.5;
  const transactionFee = 30;
  const merchantId = 'abcdef';

  beforeEach(async() => {
    await clear();
  });

  describe('#_create()', () => {
    it('should create a Producer object successfully', async () => {
      const location = await Location.createWithAddress(address);
      const merchant = await Merchant.create(percentageFee, transactionFee);
      const {_id} = await Producer._create(name, username, password, description,
                                              profileImage, exampleOrder, location,
                                              merchant, menuLink, {phoneNumber, enabled});
      const producer = await Producer.findOneByObjectId(_id);

      assert.equal(producer.name, name);
      assert.equal(producer.username, username);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.profileImage, profileImage);
      assert.equal(producer.exampleOrder, exampleOrder);
      assert.equal(producer.menuLink, menuLink);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.enabled, enabled);
    });
  });

  describe('#create()', () => {
    it('should create a Producer object successfully', async() => {
      const {_id} = await Producer.create(name, username, password, description, profileImage, exampleOrder,
        address, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, profileImage, enabled}});

      const producer = await Producer.findOneByObjectId(_id);
      assert.equal(producer.name, name);
      assert.equal(producer.username, username);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.profileImage, profileImage);
      assert.equal(producer.location.address, address);
      assert.equal(producer.merchant.percentageFee, percentageFee);
      assert.equal(producer.merchant.transactionFee, transactionFee);
      assert.equal(producer.menuLink, menuLink);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.enabled, enabled);
    });

    it('should create a default disabled Producer object successfully', async () => {
      const {_id} = await Producer.create(name, username, password, description, profileImage, exampleOrder,
        address, percentageFee, transactionFee, menuLink, {producer: {phoneNumber}, merchant: {merchantId}});
      const producer = await Producer.findOneByObjectId(_id);

      assert.equal(producer.name, name);
      assert.equal(producer.username, username);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.profileImage, profileImage);
      assert.equal(producer.exampleOrder, exampleOrder);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.location.address, address);
      assert.equal(producer.merchant.percentageFee, percentageFee);
      assert.equal(producer.merchant.transactionFee, transactionFee);
      assert.equal(producer.merchant.merchantId, merchantId);
      assert.equal(producer.enabled, false);
      assert.equal(producer.menuLink, menuLink);
    });

    it('should fail to create a Producer with no name', async () => {
      try {
        await Producer.create(null, username, password, description, profileImage, exampleOrder,
          address, percentageFee, transactionFee, menuLink, {producer: {phoneNumber: '1234567890', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no username', async () => {
      try {
        await Producer.create(name, null, password, description, profileImage, address, exampleOrder,
          percentageFee, transactionFee, menuLink, {producer: {phoneNumber: '1234567890', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no description', async () => {
      try {
        await Producer.create(name, username, password, null, profileImage, address, exampleOrder,
          percentageFee, transactionFee, menuLink, {producer: {phoneNumber: '1234567890', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no password', async() => {
      try {
        await Producer.create(name, username, null, description, profileImage, address, exampleOrder,
          percentageFee, transactionFee, menuLink, {producer: {phoneNumber: '1234567890', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no profileImage', async () => {
      try {
        await Producer.create(name, username, password, description, null, address, exampleOrder,
          percentageFee, transactionFee, menuLink, {producer: {phoneNumber: '1234567890', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no profileImage', async () => {
      try {
        await Producer.create(name, username, password, description, profileImage, address, null,
          percentageFee, transactionFee, menuLink, {producer: {phoneNumber: '1234567890', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no address', async () => {
      try {
        await Producer.create('Pizza Hut', username, password, 'some description', profileImage, exampleOrder,
          null, percentageFee, transactionFee, menuLink, {producer: {phoneNumber: '1234567890', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no percentage fee', async () => {
      try {
        await Producer.create('Pizza Hut', username, password, 'some description', profileImage, exampleOrder,
          address, null, transactionFee, menuLink, {producer: {phoneNumber: '1234567890', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no transaction fee', async () => {
      try {
        await Producer.create('Pizza Hut', username, password, 'some description', profileImage, exampleOrder,
          address, percentageFee, null, menuLink, {producer: {phoneNumber: '1234567890', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no menu link', async () => {
      try {
        await Producer.create('Pizza Hut', username, password, 'some description', profileImage, exampleOrder,
          address, percentageFee, transactionFee, null, {producer: {phoneNumber: '1234567890', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with non 10 digit phone number', async() => {
      try {
        await Producer.create('Pizza Hut', username, 'password', 'some description', profileImage, exampleOrder,
          address, percentageFee, transactionFee, menuLink, {producer: {phoneNumber: '123456789', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });
  });

  describe('#findOneByObjectId()', () => {
    it('should find a producer correctly', async() => {
      const {_id} = await Producer.create(name, username, password, description, profileImage, exampleOrder,
        address, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}});
      const producer = await Producer.findOneByObjectId(_id);

      assert.equal(producer.name, name);
      assert.equal(producer.username, username);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.profileImage, profileImage);
      assert.equal(producer.exampleOrder, exampleOrder);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.location.address, address);
      assert.equal(producer.merchant.percentageFee, percentageFee);
      assert.equal(producer.merchant.transactionFee, transactionFee);
      assert.equal(producer.enabled, enabled);
      assert.equal(producer.menuLink, menuLink);
    });

    it('should return null if nothing is found', async() => {
      try {
        await Producer.findOneByObjectId(mongoose.Schema.Types.ObjectId()); // eslint-disable-line
      } catch (err) {
        return;
      }
      assert(false);
    });
  });

  describe('#findOneByUsername()', () => {
    it('should find a producer correctly', async () => {
      await Producer.create(name, username, password, description,
        profileImage, exampleOrder, address, percentageFee, transactionFee,
        menuLink, {producer: {phoneNumber, enabled}});
      const producer = await Producer.findOneByUsername(username);

      assert.equal(producer.name, name);
      assert.equal(producer.username, username);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.profileImage, profileImage);
      assert.equal(producer.exampleOrder, exampleOrder);
      assert.equal(producer.enabled, enabled);
      assert.equal(producer.menuLink, menuLink);
    });

    it('should return null if nothing is found', async () => {
      try {
        await Producer.findOneByUsername(username); // eslint-disable-line
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
    const address2 = '1811 Guadalupe St, 78705';
    const phoneNumber2 = '2345678901';
    const profileImage2 = 'www.anothaimage.com';
    const enabled2 = false;
    const menuLink2 = 'www.somemenulink.com';
    const merchantId2 = '987654';

    const name3 = 'mcdonalds';
    const username3 = 'mcdonalds';
    const password3 = 'bigmac';
    const description3 = 'some mcdonalds description';
    const profileImage3 = 'www.anothaoneimage.com';
    const address3 = '414 W Martin Luther King Jr. Blvd, 78705';
    const enabled3 = true;
    const menuLink3 = 'pizzahutmenu.com';
    const merchantId3 = 'lolol';

    it('should find a singular enabled producer', async () => {
      const {_id: id1} = await Producer.create(name, username, password, description, profileImage, exampleOrder,
        address, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}, merchant: {merchantId}});
      const {_id: id2} = await Producer.create(name2, username2, password2, description2, profileImage2, exampleOrder,
        address2, percentageFee, transactionFee, menuLink2,
        {producer: {phoneNumber, enabled2}, merchant: {merchantId2}});

      assert.notDeepEqual(id1, id2);
      const producers = await Producer.findFbEnabled();
      assert.equal(producers.length, 1);
      assert.deepEqual(producers[0]._id, id1);
    });

    it('should find multiple enabled producers', async () => {
      const {_id: id1} = await Producer.create(name, username, password, description, profileImage, exampleOrder,
        address, percentageFee, transactionFee, menuLink, {producer: {phoneNumber2, enabled}, merchant: {merchantId}});
      const {_id: id2} = await Producer.create(name2, username2, password2, description2, profileImage2, exampleOrder,
        address2, percentageFee, transactionFee, menuLink2,
        {producer: {phoneNumber, enabled: enabled2}, merchant: {merchantId: merchantId2}});
      const {_id: id3} = await Producer.create(name3, username3, password3, description3, profileImage3, exampleOrder,
        address3, percentageFee, transactionFee, menuLink3,
        {producer: {phoneNumber, enabled: enabled3}, merchant: {merchantId: merchantId3}});

      assert.notDeepEqual(id1, id2);
      assert.notDeepEqual(id2, id3);
      assert.notDeepEqual(id1, id3);
      const producers = await Producer.findFbEnabled();
      assert.equal(producers.length, 2);
      assert.deepEqual(producers[0]._id, id1);
      assert.deepEqual(producers[1]._id, id3);
    });

    it('should limit the sample size of producers found', async() => {
      const {_id: id1} = await Producer.create(name, username, password, description, profileImage, exampleOrder,
        address, percentageFee, transactionFee, menuLink, {producer: {phoneNumber2, enabled}, merchant: {merchantId}});
      const {_id: id2} = await Producer.create(name2, username2, password2, description2, profileImage2,
        exampleOrder, address2, percentageFee, transactionFee, menuLink2,
        {producer: {phoneNumber, enabled: enabled2}, merchant: {merchantId: merchantId2}});
      const {_id: id3} = await Producer.create(name3, username3, password3, description3, profileImage3, exampleOrder,
        address3, percentageFee, transactionFee, menuLink3,
        {producer: {phoneNumber, enabled: enabled3}, merchant: {merchantId: merchantId3}});

      assert.notDeepEqual(id1, id2);
      assert.notDeepEqual(id2, id3);
      assert.notDeepEqual(id1, id3);
      const producers = await Producer._find({}, 1, {createdAt: 'descending'}, ['merchant']);
      assert.equal(producers.length, 1);
      assert.deepEqual(producers[0]._id, id1);
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
      exampleOrder: 'This is an updated example order',
      enabled: true,
      menuLink: 'www.menulink.com'
    };

    it('should update a producer correctly', async() => {
      const {_id} = await Producer.create(name, username, password, description, profileImage, exampleOrder,
        address, percentageFee, transactionFee, menuLink);
      await Producer.updateByObjectId(_id, fields);
      const producer = await Producer.findOneByObjectId(_id);
      assert.equal(producer.name, fields.name);
      assert.equal(producer.username, fields.username);
      assert.equal(producer.password, fields.password);
      assert.equal(producer.description, fields.description);
      assert.equal(producer.location.address, address);
      assert.equal(producer.merchant.percentageFee, percentageFee);
      assert.equal(producer.merchant.transactionFee, transactionFee);
      assert.equal(producer.phoneNumber, fields.phoneNumber);
      assert.equal(producer.profileImage, fields.profileImage);
      assert.equal(producer.exampleOrder, fields.exampleOrder);
      assert.equal(producer.enabled, fields.enabled);
      assert.equal(producer.menuLink, fields.menuLink);
    });

    it('should not update a producer if phoneNumber is invalid', async() => {
      const {_id} = await Producer.create(name, username, password, description, profileImage, exampleOrder,
        address, percentageFee, transactionFee, menuLink);
      try {
        await Producer.updateByObjectId(_id, {phoneNumber: '123456789'});
      } catch (err) {
        return;
      }
      assert(false);
    });
  });
});
