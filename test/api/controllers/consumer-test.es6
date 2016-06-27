import * as Consumer from '../../../api/controllers/consumer.es6';
import * as Producer from '../../../api/controllers/producer.es6';
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

        await Consumer.addLocation(-1000, longitude);
      } catch (e) {
        return;
      }

      assert(false);
    });
  });

  describe('#findDistanceFromLocation()', async () => {
    const latitude = 33.044165;
    const longitude = -96.815312;

    it('should successfully find the distance between consumer\'s location and another location', async () => {
      let consumer = await Consumer.createFbConsumer(fbId, optionalAttributes);

      await Consumer.addLocation(consumer.fbId, latitude, longitude);
      consumer = await Consumer.findOneByFbId(consumer.fbId);
      const dist = await Consumer.findDistanceFromLocation(consumer.fbId, 24.319821, 120.966393);

      assert.equal(dist, 7770.4);
    });

    it('should fail to find the distance from an invalid location', async () => {
      let consumer = await Consumer.createFbConsumer(fbId, optionalAttributes);

      await Consumer.addLocation(consumer.fbId, latitude, longitude);
      consumer = await Consumer.findOneByFbId(consumer.fbId);
      try {
        await Consumer.findDistanceFromLocation(consumer.fbId, 1000, 120.966393);
      } catch (e) {
        return;
      }

      assert(false);
    });
  });

  describe('#getClosestProducers()', async () => {
    it('should get the closest producers to the consumer', async () => {
      const name = 'Pizza Hut';
      const password = 'password';
      const username = 'pizzahut';
      const description = 'some description';
      const profileImage = 'pizzahut.com/profileImage';
      const exampleOrder = 'this is an example order';
      const address = '1811 Guadalupe St, 78705';
      const menuLink = 'menulink.com';
      const percentageFee = 12.5;
      const transactionFee = 30;
      const latitude = 33.044165;
      const longitude = -96.815312;

      await Producer.create(name, username, password, description, profileImage, exampleOrder,
        address, percentageFee, transactionFee, menuLink, {
          merchant: {
            merchantId: '987654'
          },
          producer: {
            enabled: true
          }
        });
      await Producer.create('El Queso', 'bowl', 'burrito', 'another description', profileImage, exampleOrder,
        'Windhaven Plaza, 3309 Dallas Pkwy #451, 75093', 12.5, 30, menuLink, {producer: {enabled: true}});
      let consumer = await Consumer.createFbConsumer(fbId, optionalAttributes);
      await Consumer.addLocation(consumer.fbId, latitude, longitude);
      consumer = await Consumer.findOneByFbId(consumer.fbId);

      const results = await Consumer.getClosestProducers(consumer.fbId, 20, 4);
      assert.equal(results[0].location.coordinates.latitude, 33.0077697);
      assert.equal(results[0].location.coordinates.longitude, -96.8433764);
      assert.equal(results[0].name, 'El Queso');
    });
  });
});
