import * as hour from '../../../api/controllers/hour.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';
import * as Producer from '../../../api/controllers/producer.es6';
describe('Hours DB API', () => {
  const password = 'password';
  const description = 'some description';
  beforeEach(async () => {
    await clear();
  });
  describe('#create', () => {
    it('should create an hour object successfully', async () => {
      const checkHour = await hour.create('Monday', '07:00', '21:00');
      assert.equal(checkHour.day, 'Monday');
      assert.equal(checkHour.openTime, '07:00');
      assert.equal(checkHour.closeTime, '21:00');
    });
    it('should fail', async () => {
      try {
        await hour.create('Monday', '12:00', '25:00');
      } catch (e) {
        return;
      }
      assert(false);
    });
    it('should fail from an out of bounds opening time', async () => {
      try {
        await hour.create('Monday', '29:00', '10:00');
      } catch (e) {
        return;
      }
      assert(false);
    });
    it('should fail if invalid day', async () => {
      try {
        await hour.create('kevin', '10:00', '22:00');
      } catch (e) {
        return;
      }
      assert(false);
    });
    it('should fail if openTime > closeTime', async () => {
      try {
        await hour.create('Monday', '13:00', '07:00');
      } catch (e) {
        return;
      }
      assert(false);
    });
  });
  describe('#getHours', () => {
    const fields = {
      password: 'Updated Password',
      description: 'Updated Description',
      profileImage: 'www.updated.com',
      hour: {
        day: 'Tuesday',
        openTime: '07:00',
        closeTime: '20:00',
        newClose: '23:00'
      }
    };
    it('should work, tests using getHours for a specific producer', async () => {
      const {_id} = await Producer._create('Food truck', 'DoMinos', password, description, fields.profileImage, 1, 1, {
        merchant: {
          merchantId: '987654'
        }});
      const hours1 = await hour.create(fields.hour.day, fields.hour.openTime, fields.hour.closeTime);
      const hours2 = await hour.create(fields.hour.day, '20:30', fields.hour.newClose);
      const hourArray = [hours1, hours2];
      await Producer.addHours(_id, hourArray);
      const check = await Producer.getHours(_id);
      assert.equal(check[0].day, 'Tuesday');
      assert.equal(check[1].closeTime, fields.hour.newClose);
    });
  });
  describe('#addHours', () => {
    const fields = {
      password: 'Updated Password',
      description: 'Updated Description',
      profileImage: 'www.updated.com'
    };
    it('should work tests using addHours for adding several hours', async () => {
      const hours = {
        day: 'Wednesday',
        day2: 'Saturday',
        openTime: '07:00',
        closeTime: '20:00',
        newClose: '19:00'
      };
      const {_id} = await Producer._create('Food truck', 'D-ominos', password, description, fields.profileImage, 1, 1, {
        merchant: {
          merchantId: '987655'
        }});
      const hours1 = await hour.create(hours.day, hours.openTime, hours.closeTime);
      const hour2 = await hour.create(hours.day2, hours.openTime, hours.newClose);
      const checkProd = await Producer.addHours(_id, [hours1, hour2]);
      assert.equal(checkProd.hours[0].day, hours.day);
      assert.equal(checkProd.hours[1].day, hours.day2);
    });
    it('should work using addHours to add a single hour', async () => {
      const hours = {
        day: 'Wednesday',
        openTime: '01:00',
        closeTime: '20:00'
      };
      const {_id} = await Producer._create('Food truck', 'D-2ominos',
        password, description, fields.profileImage, 1, 1, {
          merchant: {
            merchantId: '927655'
          }});
      const hours1 = await hour.create('Sunday', hours.openTime, hours.closeTime);
      const checkProd = await Producer.addHours(_id, [hours1]);
      assert.equal(checkProd.hours[0].day, 'Sunday');
    });
  });
  describe('#deleteHours', () => {
    const fields = {
      password: 'Updated Password',
      description: 'Updated Description',
      profileImage: 'www.updated.com'
    };
    it('should work tests deleting a single hour object from producer', async () => {
      const hours = {
        day: 'Monday',
        openTime: '07:00',
        closeTime: '20:00'
      };
      const {_id} = await Producer._create('Food truck', 'domino', password, description, fields.profileImage, 1, 1, {
        merchant: {
          merchantId: '987655'
        }});
      const hours1 = await hour.create(hours.day, hours.openTime, hours.closeTime);
      await Producer.addHours(_id, [hours1]);
      const prodCheck = await Producer.deleteHours(_id, [hours1._id]);
      assert.equal(0, prodCheck.hours.length);
    });
    it('should work tests deleting several hours from a producer object', async () => {
      const hours = {
        day: 'Wednesday',
        day2: 'Sunday',
        openTime: '07:00',
        closeTime: '20:00',
        newClose: '19:00'
      };
      const {_id} = await Producer._create('Food truck', 'dominotoss', password,
        description, fields.profileImage, 1, 1, {
          merchant: {
            merchantId: '987655'
          }});
      const hours1 = await hour.create(hours.day, hours.openTime, hours.closeTime);
      const hours2 = await hour.create(hours.day2, hours.openTime, hours.newClose);
      await Producer.addHours(_id, [hours1, hours2]);
      const checkProd = await Producer.deleteHours(_id, [hours1._id, hours2._id]);
      assert.equal(0, checkProd.hours.length);
    });
  });
  describe('#deleteDay', async () => {
    const fields = {
      password: 'Updated Password',
      description: 'Updated Description',
      profileImage: 'www.updated.com',
      menuLink: 'www.menulink.com'
    };
    const hours = {
      day: 'Wednesday',
      openTime: '07:00',
      newOpen: '21:00',
      closeTime: '20:00',
      newClose: '22:00'
    };
    it('should work, tests deleting a specific day of hours from a  producer', async () => {
      const {_id} = await Producer._create('Food truck', 'dominoss', password, description, fields.profileImage, 1, 1, {
        merchant: {
          merchantId: '987675'
        }});
      const hour1 = await hour.create(hours.day, hours.openTime, hours.closeTime);
      const hour2 = await hour.create(hours.day, hours.newOpen, hours.newClose);
      await Producer.addHours(_id, [hour1, hour2]);
      const checkProd = await Producer.deleteDay(_id, hours.day);
      assert.equal('0', checkProd.hours.length);
    });
  });
  describe('hours validator in Producer schema', async () => {
    it('should fail because the open times overlap', async () => {
      try {
        const hours = {
          day: 'Wednesday',
          open1: '07:00',
          open2: '08:00',
          close1: '20:00',
          close2: '22:00'
        };
        const {_id} = await Producer._create('Food truck', 'dominoss', password,
          description, 'www.updated.com', 1, 1, {
            merchant: {
              merchantId: '987685'
            }});
        const hour1 = await hour.create(hours.day, hours.open1, hours.close1);
        const hour2 = await hour.create(hours.day, hours.open2, hours.close2);
        await Producer.addHours(_id, [hour1, hour2]);
      } catch (e) {
        return;
      }
      assert(false);
    });
  });
  describe('#findOpen', async () => {
    it('should give all currently open', async () => {
      const hours = {
        day: 'Wednesday',
        open1: '07:00',
        open2: '08:00',
        close1: '20:00',
        close2: '22:00'
      };
      const {_id: id1} = await Producer._create('Food truck', 'do6minoss', password,
        description, 'www.updated.com', 'food', {enabled: true}, {
          merchant: {
            merchantId: '986685'
          }});
      const {_id: id2} = await Producer._create('Food truck 2', 'do2minoss', password,
        description, 'www.updated.com', 'food', {enabled: true}, {
          merchant: {
            merchantId: '986682'
          }});
      const {_id: id3} = await Producer._create('Food truck 3', 'do3minoss', password,
        description, 'www.updated.com', 'food', {enabled: true}, {
          merchant: {
            merchantId: '986442'
          }});
      const hour1 = await hour.create(hours.day, hours.open1, hours.close1);
      const hour2 = await hour.create('Thursday', hours.open2, hours.close2);
      const hour3 = await hour.create(hours.day, '10:00', '14:00');
      const hour4 = await hour.create('Monday', '10:00', '14:00');
      const hour5 = await hour.create('Tuesday', '10:00', '14:00');
      await Producer.addHours(id1, [hour1, hour2]);
      await Producer.addHours(id2, [hour3, hour4]);
      await Producer.addHours(id3, [hour5]);
      const openProds = await Producer.findOpenHelper(1200, 'Wednesday');
      assert.equal(openProds[0].hours[0].day, 'Wednesday');
      assert.equal(openProds[1].hours[1].day, 'Monday');
    });
  });
});
