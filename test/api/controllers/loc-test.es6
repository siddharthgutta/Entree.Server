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

    it('should fail to create a Location object', async() => {
      try {
        await Location.createWithCoord(100, attributes.goodLongitude);
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

  describe('#findLocationFromCoordinates()', async() => {
    it('should successfully find a location from its coordinates', async() => {
      await Location.createWithCoord(attributes.goodLatitude, attributes.goodLongitude);

      const location = await Location.findLocationFromCoordinates(attributes.goodLatitude, attributes.goodLongitude);
      assert.equal(location.coordinates.latitude, attributes.goodLatitude);
      assert.equal(location.coordinates.longitude, attributes.goodLongitude);
    });

    it('should return null if nothing is found', async() => {
      try {
        await Location.findLocationFromCoordinates(attributes.goodLatitude, 96.8136069);
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

    it('should return null if nothing is found', async() => {
      try {
        await Location.findLocationFromAddress('201 E 21st St');
      } catch (e) {
        return;
      }

      assert(false);
    });
  });

  describe('#findDistanceInMiles()', async() => {
    it('should successfully find the distance between two locations', async() => {
      const school = await Location.createWithAddress(attributes.address);
      const university = await Location.createWithAddress('201 E 21st St, 78705');

      const dist = Location.findDistanceInMiles(school, university);
      assert.equal(dist, 197.8);
    });

    it('should throw an error because of invalid inputs', async() => {
      try {
        const school = await Location.createWithAddress(attributes.address);
        Location.findDistanceInMiles(school, null);
      } catch (e) {
        return;
      }

      assert(false);
    });
  });

  describe('#orderByDistance()', async() => {
    it('should successfully order these locations from the starting distance', async() => {
      const school = await Location.createWithAddress(attributes.address);

      const home = await Location.createWithAddress('6369 Westblanc Dr, 75093');
      const whiteHouse = await Location.createWithAddress('1600 Pennsylvania Avenue North, 20500');
      const china = await Location.createWithCoord(24.319821, 120.966393);
      const array = [home, whiteHouse, china];

      const ordered = Location.orderByDistance(school, array);
      assert.equal(ordered[0].longitude, -96.83911);
      assert.equal(ordered[0].latitude, 33.0474869);
      assert.equal(ordered[1].longitude, -77.0367349);
      assert.equal(ordered[1].latitude, 38.8976094);
      assert.equal(ordered[2].longitude, 120.966393);
      assert.equal(ordered[2].latitude, 24.319821);
    });

    it('should throw an error because of invalid input', async() => {
      try {
        const home = await Location.createWithAddress('6369 Westblanc Dr, 75093');
        const whiteHouse = await Location.createWithAddress('1600 Pennsylvania Avenue North, 20500');
        const china = await Location.createWithCoord(24.319821, 120.966393);
        const array = [home, whiteHouse, china];

        Location.orderByDistance(null, array);
      } catch (e) {
        return;
      }

      assert(false);
    });

    it('should throw an error because of invalid input', async() => {
      try {
        const school = await Location.createWithCoord(attributes.goodLatitude, attributes.goodLongitude);

        const home = await Location.createWithAddress('6369 Westblanc Dr, 75093');
        Location.orderByDistance(school, home);
      } catch (e) {
        return;
      }

      assert(false);
    });
  });
});
