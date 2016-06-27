import * as hours from '../../../api/controllers/hours.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';
const hour = hours;
describe('Hours DB API', () => {
  const attributes = {
    days: 'Monday',
    open: '07:00',
    close: '23:00'
  };
  beforeEach(async () => {
    await clear();
  });
  describe('#create', () => {
    it('should create an hour object successfully', async () => {
      const temp = await hour.createHours(attributes.days, attributes.open, attributes.close);
      assert.equal(temp.day, attributes.days);
      assert.equal(temp.openTime, attributes.open);
      assert.equal(temp.closeTime, attributes.close);
    });
    it('should fail', async () => {
      try {
        console.log('test 2');
        await hour.createHours(attributes.days, attributes.open, '25:00');
      } catch (e) {
        return;
      }
      assert(false);
    });
    it('should fail from an out of bounds opening time', async () => {
      try {
        console.log('test 3');
        await hour.createHours(attributes.days, '29:00', attributes.close);
      } catch (e) {
        return;
      }
      assert(false);
    });
    it('should fail if invalid day', async () => {
      try {
        console.log('test 4');
        await hour.createHours('kevin', attributes.open, attributes.close);
      } catch (e) {
        return;
      }
      assert(false);
    });
  });});
