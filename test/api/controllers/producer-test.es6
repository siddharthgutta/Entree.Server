import * as Producer from '../../../api/controllers/producer.es6';
import * as Location from '../../../api/controllers/location.es6';
// import * as Merchant from '../../../api/controllers/merchant.es6';
import shortid from 'shortid';
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
  const exampleOrder = 'This is an example order';
  const enabled = true;
  const menuLink = 'www.menulink.com';
  const percentageFee = 12.5;
  const transactionFee = 30;
  const merchantId = 'abcdef';
  const address = '1811 Guadalupe St, 78705';
  const lat = 30.2811459;
  const long = -97.74176779999999;

  beforeEach(async() => {
    await clear();
  });

  describe('#create()', () => {
    it('should create a Producer object successfully with an address', async () => {
      const {_id} = await Producer.create(name, username, password, description, profileImage, exampleOrder,
        address, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}});
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
  });

  describe('#_create()', () => {
    it('should create a Producer object successfully', async () => {
      const location = await Location.createWithCoord(lat, long);
      const {_id} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
       location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}, merchant: {merchantId}});
      const producer = await Producer.findOneByObjectId(_id);
      assert.equal(producer.name, name);
      assert.equal(producer.username, username);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.profileImage, profileImage);
      assert.equal(producer.location.coordinates.latitude, lat);
      assert.equal(producer.location.coordinates.longitude, long);
      assert.equal(producer.merchant.percentageFee, percentageFee);
      assert.equal(producer.merchant.transactionFee, transactionFee);
      assert.equal(producer.menuLink, menuLink);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.enabled, enabled);
    });

    it('should create a default disabled Producer object successfully', async () => {
      const location = await Location.createWithCoord(lat, long);
      const {_id} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber}, merchant: {merchantId}});
      const producer = await Producer.findOneByObjectId(_id);

      assert.equal(producer.name, name);
      assert.equal(producer.username, username);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.profileImage, profileImage);
      assert.equal(producer.exampleOrder, exampleOrder);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.location.coordinates.latitude, lat);
      assert.equal(producer.location.coordinates.longitude, long);
      assert.equal(producer.merchant.percentageFee, percentageFee);
      assert.equal(producer.merchant.transactionFee, transactionFee);
      assert.equal(producer.enabled, false);
      assert.equal(producer.menuLink, menuLink);
    });

    it('should fail to create a Producer with no name', async () => {
      try {
        const location = await Location.createWithCoord(lat, long);
        await Producer._create(null, username, password, description, profileImage, exampleOrder,
          location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no username', async () => {
      try {
        const location = await Location.createWithCoord(lat, long);
        await Producer._create(name, null, password, description, profileImage, exampleOrder,
          location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no description', async () => {
      try {
        const location = await Location.createWithCoord(lat, long);
        await Producer._create(name, username, password, null, profileImage, exampleOrder,
          location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no password', async() => {
      try {
        const location = await Location.createWithCoord(lat, long);
        await Producer._create(name, username, null, description, profileImage, exampleOrder,
          location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no profileImage', async () => {
      try {
        const location = await Location.createWithCoord(lat, long);
        await Producer._create(name, username, password, description, null, exampleOrder,
          location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no location', async () => {
      try {
        await Producer._create(name, username, password, description, profileImage, exampleOrder,
          null, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no percentage fee', async () => {
      try {
        const location = await Location.createWithCoord(lat, long);
        await Producer._create('Pizza Hut', username, password, 'some description', profileImage, exampleOrder,
          location, null, transactionFee, menuLink, {producer: {phoneNumber: '1234567890', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with no menu link', async () => {
      try {
        const location = await Location.createWithCoord(lat, long);
        await Producer._create('Pizza Hut', username, password, 'some description', profileImage, exampleOrder,
          location, percentageFee, transactionFee, null, {producer: {phoneNumber: '1234567890', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Producer with non 10 digit phone number', async() => {
      try {
        const location = await Location.createWithCoord(lat, long);
        await Producer._create('Pizza Hut', username, 'password', 'some description', profileImage, exampleOrder,
          location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber: '123456789', enabled: true}});
      } catch (e) {
        return;
      }
      assert(false);
    });
  });

  describe('#findOneByObjectId()', async () => {
    it('should find a producer correctly', async() => {
      const location = await Location.createWithCoord(lat, long);
      const {_id} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}, merchant: {merchantId}});
      const producer = await Producer.findOneByObjectId(_id);

      assert.equal(producer.name, name);
      assert.equal(producer.username, username);
      assert.equal(producer.password, password);
      assert.equal(producer.description, description);
      assert.equal(producer.profileImage, profileImage);
      assert.equal(producer.exampleOrder, exampleOrder);
      assert.equal(producer.phoneNumber, phoneNumber);
      assert.equal(producer.location.coordinates.latitude, lat);
      assert.equal(producer.location.coordinates.longitude, long);
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
      const location = await Location.createWithCoord(lat, long);
      await Producer._create(name, username, password, description,
        profileImage, exampleOrder, location, percentageFee, transactionFee, menuLink,
        {producer: {phoneNumber, enabled}, merchant: {merchantId}});
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
    const password2 = 'password';
    const description2 = 'some dominos description';
    const phoneNumber2 = '2345678901';
    const profileImage2 = 'www.anothaimage.com';
    const enabled2 = false;
    const menuLink2 = 'www.somemenulink.com';

    const name3 = 'mcdonalds';
    const password3 = 'bigmac';
    const description3 = 'some mcdonalds description';
    const profileImage3 = 'www.anothaoneimage.com';
    const enabled3 = true;
    const menuLink3 = 'pizzahutmenu.com';

    it('should find a singular enabled producer', async () => {
      const location = await Location.createWithCoord(lat, long);
      const {_id: id1} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}, merchant: {merchantId}});
      const {_id: id2} = await Producer._create(name2, shortid.generate(), password2, description2,
        profileImage2, exampleOrder, location, percentageFee, transactionFee, menuLink2,
        {producer: {phoneNumber, enabled2}, merchant: {merchantId: shortid.generate()}});

      assert.notDeepEqual(id1, id2);
      const producers = await Producer.findFbEnabled();
      assert.equal(producers.length, 1);
      assert.deepEqual(producers[0]._id, id1);
    });

    it('should find multiple enabled producers', async () => {
      const location = await Location.createWithCoord(lat, long);
      const {_id: id1} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber2, enabled},
        merchant: {merchantId: shortid.generate()}});
      const {_id: id2} = await Producer._create(name2, shortid.generate(), password2, description2,
        profileImage2, exampleOrder, location, percentageFee, transactionFee, menuLink2,
        {producer: {phoneNumber, enabled: enabled2}, merchant: {merchantId: shortid.generate()}});
      const {_id: id3} = await Producer._create(name3, shortid.generate(), password3, description3,
        profileImage3, exampleOrder, location, percentageFee, transactionFee, menuLink3,
        {producer: {phoneNumber, enabled: enabled3}, merchant: {merchantId: shortid.generate()}});

      assert.notDeepEqual(id1, id2);
      assert.notDeepEqual(id2, id3);
      assert.notDeepEqual(id1, id3);
      const producers = await Producer.findFbEnabled();
      assert.equal(producers.length, 2);
      assert.deepEqual(producers[0]._id, id1);
      assert.deepEqual(producers[1]._id, id3);
    });

    it('should limit the sample size of producers found', async() => {
      const location = await Location.createWithCoord(lat, long);
      const {_id: id1} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber2, enabled},
        merchant: {merchantId: shortid.generate()}});

      const {_id: id2} = await Producer._create(name2, shortid.generate(), password2, description2, profileImage2,
        exampleOrder, location, percentageFee, transactionFee, menuLink2,
        {producer: {phoneNumber, enabled: enabled2}, merchant: {merchantId: shortid.generate()}});
      const {_id: id3} = await Producer._create(name3, shortid.generate(), password3, description3, profileImage3,
        exampleOrder, location, percentageFee, transactionFee, menuLink3,
        {producer: {phoneNumber, enabled: enabled3}, merchant: {merchantId: shortid.generate()}});

      assert.notDeepEqual(id1, id2);
      assert.notDeepEqual(id2, id3);
      assert.notDeepEqual(id1, id3);
      const producers = await Producer._find({}, 1, {createdAt: 'descending'}, ['merchant']);
      assert.equal(producers.length, 1);
      assert.deepEqual(producers[0]._id, id1);
    });
  });

  describe('#findAllFbEnabled()', async () => {
    const name2 = 'Dominos';
    const password2 = 'password';
    const description2 = 'some dominos description';
    const phoneNumber2 = '2345678901';
    const profileImage2 = 'www.anothaimage.com';
    const enabled2 = false;
    const menuLink2 = 'www.somemenulink.com';

    const name3 = 'mcdonalds';
    const password3 = 'bigmac';
    const description3 = 'some mcdonalds description';
    const profileImage3 = 'www.anothaoneimage.com';
    const enabled3 = true;
    const menuLink3 = 'pizzahutmenu.com';

    it('should find multiple enabled producers', async () => {
      const location = await Location.createWithCoord(lat, long);
      const {_id: id1} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber2, enabled},
          merchant: {merchantId: shortid.generate()}});
      const {_id: id2} = await Producer._create(name2, shortid.generate(), password2, description2,
        profileImage2, exampleOrder, location, percentageFee, transactionFee, menuLink2,
        {producer: {phoneNumber, enabled: enabled2}, merchant: {merchantId: shortid.generate()}});
      const {_id: id3} = await Producer._create(name3, shortid.generate(), password3, description3,
        profileImage3, exampleOrder, location, percentageFee, transactionFee, menuLink3,
        {producer: {phoneNumber, enabled: enabled3}, merchant: {merchantId: shortid.generate()}});

      assert.notDeepEqual(id1, id2);
      assert.notDeepEqual(id2, id3);
      assert.notDeepEqual(id1, id3);
      const producers = await Producer.findAllEnabled();
      assert.equal(producers.length, 2);
      assert.deepEqual(producers[0]._id, id1);
      assert.deepEqual(producers[1]._id, id3);
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
      const location = await Location.createWithCoord(lat, long);
      const {_id} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, menuLink);
      await Producer.updateByObjectId(_id, fields);
      const producer = await Producer.findOneByObjectId(_id);
      assert.equal(producer.name, fields.name);
      assert.equal(producer.username, fields.username);
      assert.equal(producer.password, fields.password);
      assert.equal(producer.description, fields.description);
      assert.equal(producer.location.coordinates.latitude, lat);
      assert.equal(producer.location.coordinates.longitude, long);
      assert.equal(producer.merchant.percentageFee, percentageFee);
      assert.equal(producer.merchant.transactionFee, transactionFee);
      assert.equal(producer.phoneNumber, fields.phoneNumber);
      assert.equal(producer.profileImage, fields.profileImage);
      assert.equal(producer.exampleOrder, fields.exampleOrder);
      assert.equal(producer.enabled, fields.enabled);
      assert.equal(producer.menuLink, fields.menuLink);
    });

    it('should not update a producer if phoneNumber is invalid', async() => {
      const location = await Location.createWithCoord(lat, long);
      const {_id} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, menuLink);
      try {
        await Producer.updateByObjectId(_id, {phoneNumber: '123456789'});
      } catch (err) {
        return;
      }
      assert(false);
    });
  });
});
