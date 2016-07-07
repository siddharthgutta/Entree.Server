import * as hour from '../../../api/controllers/hour.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';
import * as Producer from '../../../api/controllers/producer.es6';
import Moment from 'moment';
import * as Location from '../../../api/controllers/location.es6';

describe('Hours DB API', () => {
  const name = 'Pizza Hut';
  const username = 'pizzahut';
  const password = 'password';
  const description = 'some description';
  const lat = 30.2811459;
  const long = -97.74176779999999;
  const phoneNumber = '1234567890';
  const profileImage = 'www.image.com';
  const exampleOrder = 'This is an example order';
  const enabled = true;
  const menuLink = 'www.menulink.com';
  const percentageFee = 12.5;
  const transactionFee = 30;


  beforeEach(async () => {
    await clear();
  });
  describe('#create', () => {
    it('should create an hour object successfully', async () => {
      const checkHour = await hour.create('Monday', '07:00', '24:00');
      assert.equal(checkHour.day, 'Monday');
      assert.equal(checkHour.openTime, '07:00');
      assert.equal(checkHour.closeTime, '24:00');
    });
    it('should fail if the hour is 24 and has any minutes', async () => {
      try {
        await hour.create('Monday', '12:00', '24:01');
      } catch (e) {
        return;
      }
      assert(false);
    });
    it('should fail if the hour is above 24', async () => {
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
      hour: {
        day: 'Tuesday',
        openTime: '07:00',
        closeTime: '20:00',
        newClose: '23:00'
      }
    };
    it('should work, tests using getHours for a specific producer', async () => {
      const location = await Location.createWithCoord(lat, long);
      const {_id} = await Producer._create(name, 'nav', password, description,
        profileImage, exampleOrder, location, percentageFee, transactionFee, menuLink,
        {producer: {phoneNumber, enabled: true}, merchant: {merchantId: '1223ab4'}});
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
    it('should work tests using addHours for adding several hours', async () => {
      const hours = {
        day: 'Wednesday',
        day2: 'Saturday',
        openTime: '07:00',
        closeTime: '20:00',
        newClose: '19:00'
      };
      const location = await Location.createWithCoord(lat, long);
      const {_id} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}});
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
      const location = await Location.createWithCoord(lat, long);
      const {_id} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}});
      const hours1 = await hour.create('Sunday', hours.openTime, hours.closeTime);
      const checkProd = await Producer.addHours(_id, [hours1]);
      assert.equal(checkProd.hours[0].day, 'Sunday');
    });
  });
  describe('#deleteHours', () => {
    it('should work tests deleting a single hour object from producer', async () => {
      const hours = {
        day: 'Monday',
        openTime: '07:00',
        closeTime: '20:00'
      };
      const location = await Location.createWithCoord(lat, long);
      const {_id} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}});
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
      const location = await Location.createWithCoord(lat, long);
      const {_id} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}});
      const hours1 = await hour.create(hours.day, hours.openTime, hours.closeTime);
      const hours2 = await hour.create(hours.day2, hours.openTime, hours.newClose);
      await Producer.addHours(_id, [hours1, hours2]);
      const checkProd = await Producer.deleteHours(_id, [hours1._id, hours2._id]);
      assert.equal(0, checkProd.hours.length);
    });
  });
  describe('#deleteDay', async () => {
    const hours = {
      day: 'Wednesday',
      openTime: '07:00',
      newOpen: '21:00',
      closeTime: '20:00',
      newClose: '22:00'
    };
    it('should work, tests deleting a specific day of hours from a  producer', async () => {
      const location = await Location.createWithCoord(lat, long);
      const {_id} = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, menuLink, {producer: {phoneNumber, enabled}});
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

        const {_id} = await Producer._create(name, 'nav', password, description,
          profileImage, exampleOrder, location, percentageFee, transactionFee, menuLink,
          {producer: {phoneNumber, enabled: true}, merchant: {merchantId: '123ab4'}});
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
      const location = await Location.createWithCoord(lat, long);
      const {_id: id1} = await Producer._create(name, 'nav', password, description,
        profileImage, exampleOrder, location, percentageFee, transactionFee, menuLink,
        {producer: {phoneNumber, enabled: true}, merchant: {merchantId: '123abc'}});
      const {_id: id2} = await Producer._create(name, 'navs2', password, description,
        profileImage, exampleOrder, location, percentageFee, transactionFee, menuLink,
        {producer: {phoneNumber, enabled: true}, merchant: {merchantId: '123ab'}});
      const {_id: id3} = await Producer._create(name, 'navs', password, description,
        profileImage, exampleOrder, location, percentageFee, transactionFee, menuLink,
        {producer: {phoneNumber, enabled: true}, merchant: {merchantId: '123a'}});
      const hour1 = await hour.create(hours.day, hours.open1, hours.close1);
      const hour2 = await hour.create('Thursday', hours.open2, hours.close2);
      const hour3 = await hour.create(hours.day, '10:00', '14:00');
      const hour4 = await hour.create('Monday', '10:00', '14:00');
      const hour5 = await hour.create('Tuesday', '10:00', '14:00');
      await Producer.addHours(id1, [hour1, hour2]);
      await Producer.addHours(id2, [hour3, hour4]);
      await Producer.addHours(id3, [hour5]);
      const openProds = await Producer.findOpenHelper(new Moment('12:00', 'HH:mm'), 'Wednesday');
      assert.equal(openProds[0].hours[0].day, 'Wednesday');
      assert.equal(openProds[1].hours[1].day, 'Monday');
    });
  });

  describe('#isOpen', async () => {
    const hours = {
      day: 'Wednesday',
      open1: '07:00',
      open2: '08:00',
      close1: '20:00',
      close2: '22:00'
    };
    it('should work because the given current hour is within the open time (hour object)', async () => {
      const hour1 = await hour.create(hours.day, hours.open1, hours.close1);
      const hourOpen1 = Producer.isOpenHelper(new Moment('12:00', 'HH:mm'), 'Wednesday', [hour1]);
      assert.equal(true, hourOpen1);
    });
    it('should work because the given current hour is within the multiple open times (hour objects)', async () => {
      const hour2 = await hour.create(hours.day, hours.open1, hours.close1);
      const hour3 = await hour.create('Thursday', '06:00', '17:00');
      const hourOpen2 = Producer.isOpenHelper(new Moment('12:00', 'HH:mm'), 'Wednesday', [hour2, hour3]);
      assert.equal(true, hourOpen2);
    });
    it('should fail because the given current hour is not within the open time (hour object)', async () => {
      const hour4 = await hour.create('Thursday', hours.open2, hours.close2);
      const hourOpen4 = Producer.isOpenHelper(new Moment('12:00', 'HH:mm'), 'Wednesday', [hour4]);
      assert.equal(false, hourOpen4);
    });
    it('should fail because the given current hour is not within the multiple open times (hour objects)', async () => {
      const hour5 = await hour.create('Wednesday', hours.open1, hours.close1);
      const hour6 = await hour.create('Saturday', hours.open2, hours.close2);
      const hourOpen5 = Producer.isOpenHelper(new Moment('06:00', 'HH:mm'), 'Wednesday', [hour5, hour6]);
      assert.equal(false, hourOpen5);
    });
  });
  describe('#deleteAllHours', async () => {
    it('should delete all hours', async () => {
      const hours = {
        day: 'Wednesday',
        open1: '07:00',
        open2: '08:00',
        close1: '20:00',
        close2: '22:00'
      };
      const hour1 = await hour.create(hours.day, hours.open1, hours.close1);
      const hour2 = await hour.create('Sunday', hours.open2, hours.close2);
      const location = await Location.createWithCoord(lat, long);
      const {_id} = await Producer._create(name, 'nav!', password, description,
        profileImage, exampleOrder, location, percentageFee, transactionFee, menuLink,
        {producer: {phoneNumber, enabled: true}, merchant: {merchantId: '1232abc'}});
      await Producer.addHours(_id, [hour1, hour2]);
      await Producer.deleteAllHours(_id);
      const prod = await Producer.findOneByObjectId(_id);
      assert.equal(0, prod.hours.length);
    });
  });
});
