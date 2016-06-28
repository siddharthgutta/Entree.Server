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
});
