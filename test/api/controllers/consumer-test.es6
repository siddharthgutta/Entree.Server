import * as Consumer from '../../../api/controllers/consumer.es6';
import * as Producer from '../../../api/controllers/producer.es6';
import * as Location from '../../../api/controllers/location.es6';
import * as hour from '../../../api/controllers/hour.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';
import _ from 'lodash';
import moment from 'moment';

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

  describe('#findOneByFields()', () => {
    it('should find a consumer correctly', async () => {
      await Consumer.createFbConsumer(fbId, optionalAttributes);
      const consumer = await Consumer.findOneByFields({fbId, firstName: optionalAttributes.consumer.firstName,
        lastName: optionalAttributes.consumer.lastName, customerId: optionalAttributes.consumer.customerId,
        receiptCount: optionalAttributes.consumer.receiptCount});
      assert.ok(consumer.context);
    });
  });

  describe('#updateFieldsByFbId', () => {
    const updatedFields = {
      firstName: 'Jill',
      lastName: 'Jane',
      customerId: '456',
      receiptCount: 10
    };

    it('should set singular field of a consumer correctly', async () => {
      await Consumer.createFbConsumer(fbId, optionalAttributes);
      await Consumer.updateFieldsByFbId(fbId, {firstName: updatedFields.firstName});
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
        await Consumer.updateFieldsByFbId(fbId, {customerId: '1234567890123456789012345678901234567'});
      } catch (err) {
        return;
      }
      assert(false);
    });

    it('should fail to set customerId of a consumer that is an empty string', async () => {
      await Consumer.createFbConsumer(fbId, optionalAttributes);
      try {
        await Consumer.updateFieldsByFbId(fbId, {customerId: ''});
      } catch (err) {
        return;
      }
      assert(false);
    });

    it('should set multiple fields of a consumer correctly', async () => {
      await Consumer.createFbConsumer(fbId, optionalAttributes);
      await Consumer.updateFieldsByFbId(fbId, updatedFields);
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

  describe('#addLocation()', async() => {
    const latitude = 33.044165;
    const longitude = -96.815312;

    it('should add a default location', async () => {
      let consumer = await Consumer.createFbConsumer(fbId, optionalAttributes);
      await Consumer.addLocation(consumer.fbId, latitude, longitude);
      consumer = await Consumer.findOneByFbId(consumer.fbId);

      assert.equal(consumer.fbId, fbId);
      assert.equal(consumer.firstName, optionalAttributes.consumer.firstName);
      assert.equal(consumer.lastName, optionalAttributes.consumer.lastName);
      assert.equal(consumer.customerId, optionalAttributes.consumer.customerId);
      assert.equal(consumer.receiptCount, optionalAttributes.consumer.receiptCount);
      assert.equal(consumer.defaultLocation.coordinates.latitude, latitude);
      assert.equal(consumer.defaultLocation.coordinates.longitude, longitude);
      assert.ok(consumer.context);
    });

    it('should change the default location and add to the location array', async () => {
      let consumer = await Consumer.createFbConsumer(fbId, optionalAttributes);

      await Consumer.addLocation(consumer.fbId, latitude, longitude);
      await Consumer.addLocation(consumer.fbId, 24.319821, 120.966393);
      consumer = await Consumer.findOneByFbId(consumer.fbId);

      assert.equal(consumer.fbId, fbId);
      assert.equal(consumer.firstName, optionalAttributes.consumer.firstName);
      assert.equal(consumer.lastName, optionalAttributes.consumer.lastName);
      assert.equal(consumer.customerId, optionalAttributes.consumer.customerId);
      assert.equal(consumer.receiptCount, optionalAttributes.consumer.receiptCount);
      assert.equal(consumer.defaultLocation.coordinates.latitude, 24.319821);
      assert.equal(consumer.defaultLocation.coordinates.longitude, 120.966393);
      assert.equal(consumer.location[0].coordinates.latitude, latitude);
      assert.equal(consumer.location[0].coordinates.longitude, longitude);
    });

    it('should fail to add an invalid location', async () => {
      try {
        await Consumer.createFbConsumer(fbId, optionalAttributes);

        await Consumer.addLocation(fbId, -91, longitude);
      } catch (e) {
        return;
      }

      assert(false);
    });

    it('should fail to add an invalid location', async () => {
      try {
        await Consumer.createFbConsumer(fbId, optionalAttributes);

        await Consumer.addLocation(fbId, latitude, 181);
      } catch (e) {
        return;
      }
      assert(false);
    });
  });

  describe('#findDistanceFromProducerCoordinates()', async () => {
    const latitude = 33.044165;
    const longitude = -96.815312;

    it('should successfully find the distance between consumer\'s location and producer\'s location', async () => {
      const eatLocation = await Location.createWithCoord(33.046686, -96.827778);
      const {_id: id1} = await Producer._create('Eatzis', 'salad', 'sandwich', 'expensive', 'www.eatzi.com',
        'example', eatLocation, 12.5, 30, 'eatzimenu.com', {producer: {enabled: true},
          merchant: {merchantId: '123456'}});
      const quesoLocation = await Location.createWithCoord(33.047882, -96.830757);
      const {_id: id2} = await Producer._create('El Queso', 'bowl', 'burrito', 'another description',
        'profileImage.com', 'example', quesoLocation, 12.5, 30, 'quesomenu.com', {producer: {enabled: true}});

      const producer1 = await Producer.findOneByObjectId(id1);
      const producer2 = await Producer.findOneByObjectId(id2);
      const consumer = await Consumer.createFbConsumer(fbId, optionalAttributes);
      await Consumer.addLocation(consumer.fbId, latitude, longitude);
      const dists = await Consumer.findDistanceFromProducerCoordinates(consumer.fbId, [producer1, producer2]);
      assert.equal(dists[0]._distance, 0.7);
      assert.equal(dists[1]._distance, 0.9);
    });
  });

  describe('#getClosestEnabledProducers()', async () => {
    const name = 'Pizza Hut';
    const password = 'password';
    const username = 'pizzahut';
    const description = 'some description';
    const profileImage = 'pizzahut.com/profileImage';
    const address = '1811 Guadalupe St, 78705';
    const exampleOrder = 'example order';
    const menuLink = 'menulink.com';
    const percentageFee = 12.5;
    const transactionFee = 30;
    const latitude = 33.044165;
    const longitude = -96.815312;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    it('should get the closest producers to the consumer', async () => {
      let hours = [];
      _(days).forEach(async day => {
        hours.push(hour.create(day, '00:00', '24:00'));
      });
      hours = await Promise.all(hours);

      const {_id: id1} = await Producer.create(name, username, password, description, profileImage,
        exampleOrder, address, percentageFee, transactionFee, menuLink, {
          merchant: {
            merchantId: '987654'
          },
          producer: {
            enabled: true
          }
        });
      await Producer.addHours(id1, hours);
      const quesoLocation = await Location.createWithCoord(33.047882, -96.830757);
      const {_id: id2} = await Producer._create('El Queso', 'bowl', 'burrito', 'another description',
        profileImage, exampleOrder, quesoLocation, 12.5, 30, menuLink, {producer: {enabled: true}});
      await Producer.addHours(id2, hours);
      const eatLocation = await Location.createWithCoord(33.046686, -96.827778);
      const {_id: id3} = await Producer._create('Eatzis', 'salad', 'sandwich', 'expensive',
        'www.eatzi.com', exampleOrder, eatLocation, 12.5, 30, 'eatzimenu.com', {producer: {enabled: true},
          merchant: {merchantId: '123456'}});
      await Producer.addHours(id3, hours);
      const consumer = await Consumer.createFbConsumer(fbId, optionalAttributes);
      await Consumer.addLocation(consumer.fbId, latitude, longitude);

      const results = await Consumer.getClosestEnabledProducers(consumer.fbId, 20, 4);
      assert.equal(results.length, 2);
      assert.equal(results[0].name, 'Eatzis');
      assert.equal(results[1].name, 'El Queso');
    });

    it('should limit the producers', async () => {
      let hours = [];
      _(days).forEach(async day => {
        hours.push(hour.create(day, '00:00', '24:00'));
      });
      hours = await Promise.all(hours);

      const {_id: id1} = await Producer.create(name, username, password, description, profileImage, exampleOrder,
        address, percentageFee, transactionFee, menuLink, {
          merchant: {
            merchantId: '987654'
          },
          producer: {
            enabled: true
          }
        });
      await Producer.addHours(id1, hours);
      const quesoLocation = await Location.createWithCoord(33.047882, -96.830757);
      const {_id: id2} = await Producer._create('El Queso', 'bowl', 'burrito', 'another description',
        profileImage, exampleOrder, quesoLocation, 12.5, 30, menuLink, {producer: {enabled: true}});
      await Producer.addHours(id2, hours);
      const eatLocation = await Location.createWithCoord(33.046686, -96.827778);
      const {_id: id3} = await Producer._create('Eatzis', 'salad', 'sandwich', 'expensive', 'www.eatzi.com',
        exampleOrder, eatLocation, 12.5, 30, 'eatzimenu.com', {producer: {enabled: true},
          merchant: {merchantId: '123456'}});
      await Producer.addHours(id3, hours);
      const consumer = await Consumer.createFbConsumer(fbId, optionalAttributes);
      await Consumer.addLocation(consumer.fbId, latitude, longitude);

      const results = await Consumer.getClosestEnabledProducers(consumer.fbId, 20, 1);
      assert.equal(results.length, 1);
      assert.equal(results[0].name, 'Eatzis');
    });
  });
  describe('#getOrderedProducers()', async () => {
    const name = 'Art of Tacos';
    const username = 'tacotaco';
    const password = 'yumyum';
    const description = 'temp';
    const profileImage = 'http://i.imgur.com/bzuvGk6.jpg';
    const address = '75 Rainey St, Austin, TX 78701';
    const percentageFee = 4;
    const transactionFee = 30;
    const menuLink = 'http://i.imgur.com/Ryy5U7O.png';
    const lat = 30.285687;
    const long = -97.748266;
    it('should get the producers first open and closest then closed and progress', async () => {
      const {_id: id1} = await Producer.create(name, username, password, description, profileImage, 'none',
        address, percentageFee, transactionFee, menuLink, {
          merchant: {
            merchantId: '927654'
          },
          producer: {
            enabled: true
          }
        });
      const {_id: id2} = await Producer.create('Via312', 'user2', password, description, profileImage, 'nothing',
       '61 Rainey St, Austin, TX 78701', percentageFee, transactionFee, menuLink, {
         merchant: {
           merchantId: '927622'
         },
         producer: {
           enabled: true
         }
       });
      const consumer = await Consumer.createFbConsumer(fbId, optionalAttributes);
      await Consumer.addLocation(consumer.fbId, lat, long);
      const hour1 = await hour.create('Tuesday', '07:00', '21:00');
      const hour2 = await hour.create('Monday', '07:00', '21:00');
      await Producer.addHours(id1, [hour1, hour2]);
      await Producer.addHours(id2, [hour1]);
      const timeCheck = moment('12:00', 'HH:mm');
      const prodCheck = await Consumer.getOrderedProducersHelper(consumer.fbId, 2, 2, timeCheck, 'Monday', 2);
      const prod1 = await Producer.findOneByObjectId(id1);
      const prod2 = await Producer.findOneByObjectId(id2);
      assert.equal(prodCheck[0].name, prod1.name);
      assert.equal(prodCheck[1].name, prod2.name);
    });
    it('should get the producers in order of distance if all are closed', async () => {
      const {_id: id1} = await Producer.create(name, username, password, description, profileImage, 'none',
        address, percentageFee, transactionFee, menuLink, {
          merchant: {
            merchantId: '927654'
          },
          producer: {
            enabled: true
          }
        });
      const {_id: id2} = await Producer.create('Don', 'dondaddy', password, description, profileImage,
      'nothing', '817 W 5th St, Austin, TX', percentageFee, transactionFee, 'http:', {
        merchant: {
          merchantId: '923622'
        },
        producer: {
          enabled: true
        }
      });
      const hour1 = await hour.create('Tuesday', '07:00', '21:00');
      const hour2 = await hour.create('Monday', '07:00', '21:00');
      const timeCheck = moment('12:00', 'HH:mm');
      const consumer = await Consumer.createFbConsumer(fbId, optionalAttributes);
      await Consumer.addLocation(consumer.fbId, lat, long);
      await Producer.addHours(id1, [hour1, hour2]);
      await Producer.addHours(id2, [hour1, hour2]);
      const prodCheck = await Consumer.getOrderedProducersHelper(consumer.fbId, 2, 2, timeCheck, 'Thursday', 2);
      const prod1 = await Producer.findOneByObjectId(id1);
      const prod2 = await Producer.findOneByObjectId(id2);
      assert.equal(prodCheck[1].name, prod1.name);
      assert.equal(prodCheck[0].name, prod2.name);
    });
    it('should test the limiter and make sure it only grabs a certain number', async () => {
      const {_id: id1} = await Producer.create(name, username, password, description, profileImage, 'none',
        address, percentageFee, transactionFee, menuLink, {
          merchant: {
            merchantId: '927654'
          },
          producer: {
            enabled: true
          }
        });
      const {_id: id2} = await Producer.create('Don', 'dondaddy', password, description, profileImage,
        'nothing', '817 W 5th St, Austin, TX', percentageFee, transactionFee, 'http:', {
          merchant: {
            merchantId: '923622'
          },
          producer: {
            enabled: true
          }
        });
      const hour1 = await hour.create('Tuesday', '07:00', '21:00');
      const hour2 = await hour.create('Monday', '07:00', '21:00');
      const timeCheck = moment('12:00', 'HH:mm');
      const consumer = await Consumer.createFbConsumer(fbId, optionalAttributes);
      await Consumer.addLocation(consumer.fbId, lat, long);
      await Producer.addHours(id1, [hour1, hour2]);
      await Producer.addHours(id2, [hour1, hour2]);
      const prodCheck = await Consumer.getOrderedProducersHelper(consumer.fbId, 2, 2, timeCheck, 'Thursday', 1);
      assert.equal(prodCheck.length, 1);
    });
  });
});
