import * as Hours from '../../../api/db/hours.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';

describe('Hours DB API', () => {
  const attributes = {
    day: 'Monday',
    openTime: '12:00',
    closeTime: '17:00'
  };
  beforeEach(async () => {
    await clear();
  });

  describe('#create()', () => {
    it('should create an hour object successfully', async () => {
      const hours = await Hours.create({
        day: attributes.day,
        openTime: attributes.openTime,
        closeTime: attributes.closeTime});
      assert.equal(hours.day, attributes.day);
      assert.equal(hours.openTime, attributes.openTime);
      assert.equal(hours.closeTime, attributes.closeTime);
    });

    it('should fail to create an hour with a number outside of 0-24', async() => {
      try {
        await Hours.create({
          day: 'Thursday',
          openTime: '10:00',
          closeTime: '25:00'
        });
      } catch (e) {
        return;
      }
      assert(false);
    });
  });
});
