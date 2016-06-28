import * as Location from '../../../api/controllers/location.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';

describe('Controller DB API', () => {
  const attributes = {
    goodLatitude: 33.043707,
    goodLongitude: -96.8136069,
    address: '5601 W Parker Road, Plano, TX'
  };

  beforeEach(async () => {
    await clear();
  });

  describe('#createWithCoord()', () => {
    it('should create a Location object successfully', async() => {
      const location = await Location.createWithCoord(attributes.goodLatitude, attributes.goodLongitude);
      assert.equal(location.coordinates.latitude, attributes.goodLatitude);
      assert.equal(location.coordinates.longitude, attributes.goodLongitude);
    });

    it('should create a Location object successfully', async() => {
      const location = await Location.createWithCoord(90, 180);
      assert.equal(location.coordinates.latitude, 90);
      assert.equal(location.coordinates.longitude, 180);
    });

    it('should fail to create a Location object', async() => {
      try {
        await Location.createWithCoord(100, attributes.goodLongitude);
      } catch (e) {
        return;
      }

      assert(false);
    });

    it('should fail to create a Location object', async () => {
      try {
        await Location.createWithCoord(attributes.goodLatitude, -200);
      } catch (e) {
        return;
      }

      assert(false);
    });
  });

  describe('#createWithAddress()', () => {
    it('should create a Location object successfully', async() => {
      const location = await Location.createWithAddress(attributes.address);
      assert.equal(location.address, attributes.address);
      assert.equal(location.coordinates.latitude, attributes.goodLatitude);
      assert.equal(location.coordinates.longitude, attributes.goodLongitude);
    });

    it('should fail to create a Location object', async() => {
      try {
        await Location.createWithAddress('ndaskdjfba');
      } catch (e) {
        return;
      }

      assert(false);
    });
  });

  describe('#findLocationFromAddress()', async() => {
    it('should successfully find a location from the address', async() => {
      await Location.createWithAddress(attributes.address);

      const location = await Location.findLocationFromAddress(attributes.address);
      assert.equal(location.coordinates.latitude, attributes.goodLatitude);
      assert.equal(location.coordinates.longitude, attributes.goodLongitude);
      assert.equal(location.address, attributes.address);
    });

    it('should catch error if nothing is found', async() => {
      try {
        await Location.findLocationFromAddress('201 E 21st St');
      } catch (e) {
        return;
      }
      assert(false);
    });
  });
});
