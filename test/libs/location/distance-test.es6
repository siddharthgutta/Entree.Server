import * as Distance from '../../../libs/location/distance.es6';
import assert from 'assert';

describe('Distance Lib', () => {
  const schoolLatitude = 33.044165;
  const schoolLongitude = -96.815312;
  const chinaLatitude = 24.319821;
  const chinaLongitude = 120.966393;

  describe('#calcDistanceInMiles()', async () => {
    it('should calculate the distance correctly', async () => {
      const distance = Distance.calcDistanceInMiles(schoolLatitude,
				schoolLongitude, chinaLatitude, chinaLongitude);
      assert.equal(distance, 7770.4);
    });

    it('should fail to calculate the distance from an invalid location', async () => {
      try {
        Distance.calcDistanceInMiles(schoolLatitude, schoolLongitude,
					null, chinaLongitude);
      } catch (e) {
        return;
      }
      assert(false);
    });
  });

  describe('#orderByDistance()', async() => {
    it('should return ordered distances', async () => {
      const coord = {latitude: 35, longitude: 40};
      const array = {'5772de5e3b0d1fcbbcf4e830': {longitude: -97.74176779999999, latitude: 30.2811459},
                      '5772de5e3b0d1fcbbcf4e833': {longitude: -96.8433764, latitude: 33.0077697},
                      '5772de5e3b0d1fcbbcf4e836': {longitude: -96.82748079999999, latitude: 33.0454641}};
      const result = Distance.orderByDistance(coord, array);
      assert(result[0].distance < result[1].distance, 'ordered correctly');
    });
  });
});
