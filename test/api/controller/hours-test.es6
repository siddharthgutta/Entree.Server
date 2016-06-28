import * as hour from '../../../api/controllers/hour.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';
import * as Producer from '../../../api/controllers/producer.es6';
describe('Hours DB API', () => {
  const name = 'Pizza Hut';
  const password = 'password';
  const description = 'some description';
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
      const temp = await hour.create(attributes.days, attributes.open, attributes.close);
      assert.equal(temp.day, attributes.days);
      assert.equal(temp.openTime, attributes.open);
      assert.equal(temp.closeTime, attributes.close);
    });
    it('should fail', async () => {
      try {
        await hour.create(attributes.days, attributes.open, '25:00');
      } catch (e) {
        return;
      }
      assert(false);
    });
    it('should fail from an out of bounds opening time', async () => {
      try {
        await hour.create(attributes.days, '29:00', attributes.close);
      } catch (e) {
        return;
      }
      assert(false);
    });
    it('should fail if invalid day', async () => {
      try {
        await hour.create('kevin', attributes.open, attributes.close);
      } catch (e) {
        return;
      }
      assert(false);
    });
  });
  describe('#addHour', () => {
    const fields = {
      name: 'Updated Name',
      username: 'Updated Username',
      password: 'Updated Password',
      description: 'Updated Description',
      phoneNumber: '9876543210',
      profileImage: 'www.updated.com',
      enabled: true,
      menuLink: 'www.menulink.com',
      hour: {
        day: 'Tuesday',
        openTime: '07:00',
        closeTime: '20:00'
      }
    };
    it('should add hours correctly', async () => {
      const {_id} = await Producer._create(name, 'Ominos', password, description, fields.profileImage);
      const day = 'Monday';
      const open = '10:30';
      const close = '22:30';
      await Producer.addHour(day, open, close, _id);
      const producer = await Producer.findOneByObjectId(_id);
      assert.equal(producer.hours[producer.hours.length - 1].day, day);
      assert.equal(producer.hours[producer.hours.length - 1].openTime, open);
      assert.equal(producer.hours[producer.hours.length - 1].closeTime, close);
    });
  });
  describe('#getHours', () => {
    const fields = {
      name: 'Updated Name',
      username: 'Updated Username',
      password: 'Updated Password',
      description: 'Updated Description',
      phoneNumber: '9876543210',
      profileImage: 'www.updated.com',
      enabled: true,
      menuLink: 'www.menulink.com',
      hour: {
        day: 'Tuesday',
        openTime: '07:00',
        closeTime: '20:00'
      }
    };
    it('should work tests getHours ', async () => {
      const hours = {
        day: 'Wednesday',
        openTime: '07:00',
        closeTime: '20:00'
      };
      const {_id} = await Producer._create('Food truck', 'DoMinos', password, description, fields.profileImage, 1, 1, {
        merchant: {
          merchantId: '987654'
        }});
      await Producer.addHour('Wednesday', fields.hour.openTime, fields.hour.closeTime, _id);
      const check = await Producer.getHours(_id);
      assert.equal(check[0].day, hours.day);
    });
  });
  describe('#addHours', () => {
    const fields = {
      name: 'Updated Name',
      username: 'Updated Username',
      password: 'Updated Password',
      description: 'Updated Description',
      phoneNumber: '9876543210',
      profileImage: 'www.updated.com',
      enabled: true,
      menuLink: 'www.menulink.com',
      hour: {
        day: 'Tuesday',
        openTime: '07:00',
        closeTime: '20:00'
      }
    };
    it('should work tests addHours', async () => {
      const hours = {
        day: 'Wednesday',
        openTime: '07:00',
        newOpen: '08:00',
        closeTime: '20:00',
        newClose: '19:00'
      };
      const {_id} = await Producer._create('Food truck', 'D-ominos', password, description, fields.profileImage, 1, 1, {
        merchant: {
          merchantId: '987655'
        }});
      const hours1 = await hour.create(hours.day, hours.openTime, hours.closeTime);
      const hour2 = await hour.create(hours.day, hours.openTime, hours.newClose);
      const hourArray = [];
      hourArray[0] = hours1;
      hourArray[1] = hour2;
      const checkProd = await Producer.addHours(_id, hourArray);
      assert.equal(checkProd.hours[0].day, hours.day);
      assert.equal(checkProd.hours[1].day, hours.day);
    });
  });
  describe('#deleteHour', () => {
    const fields = {
      name: 'Updated Name',
      username: 'Updated Username',
      password: 'Updated Password',
      description: 'Updated Description',
      phoneNumber: '9876543210',
      profileImage: 'www.updated.com',
      enabled: true,
      menuLink: 'www.menulink.com',
      hour: {
        day: 'Tuesday',
        openTime: '07:00',
        closeTime: '20:00'
      }
    };
    it('should work tests a single hour for deleteHour', async () => {
      const hours = {
        day: 'Monday',
        openTime: '07:00',
        newOpen: '08:00',
        closeTime: '20:00',
        newClose: '19:00'
      };
      const {_id} = await Producer._create('Food truck', 'domino', password, description, fields.profileImage, 1, 1, {
        merchant: {
          merchantId: '987655'
        }});
      const hours1 = await hour.create(hours.day, hours.openTime, hours.closeTime);
      const hourArray = [];
      hourArray[0] = hours1;
      const hourId = hours1._id;
      await Producer.addHours(_id, hourArray);
      const prodCheck = await Producer.deleteHour(_id, hourId);
      assert.equal(0, prodCheck.hours.length);
    });
    it('should work tests for multiple hours for deleteHour', async () => {
      const hours = {
        day: 'Wednesday',
        openTime: '07:00',
        newOpen: '08:00',
        closeTime: '20:00',
        newClose: '19:00'
      };
      const {_id} = await Producer._create('Food truck', 'dominotoss', password,
        description, fields.profileImage, 1, 1, {
          merchant: {
            merchantId: '987655'
          }});
      const hours1 = await hour.create(hours.day, hours.openTime, hours.closeTime);
      const hours2 = await hour.create(hours.day, hours.openTime, hours.newClose);
      const hourArray = [];
      hourArray[0] = hours1;
      hourArray[1] = hours2;
      const hourIds = hours1._id;
      await Producer.addHours(_id, hourArray);
      let checkProd = await Producer.deleteHour(_id, hourIds);
      assert.equal(1, checkProd.hours.length);
      const hourIds2 = hours2._id;
      checkProd = await Producer.deleteHour(_id, hourIds2);
      assert.equal(0, checkProd.hours.length);
    });
  });
  describe('#deleteDay', async () => {
    const fields = {
      name: 'Updated Name',
      username: 'Updated Username',
      password: 'Updated Password',
      description: 'Updated Description',
      phoneNumber: '9876543210',
      profileImage: 'www.updated.com',
      enabled: true,
      menuLink: 'www.menulink.com',
      hour: {
        day: 'Tuesday',
        openTime: '07:00',
        closeTime: '20:00'
      }
    };
    const hours = {
      day: 'Wednesday',
      openTime: '07:00',
      newOpen: '08:00',
      closeTime: '20:00',
      newClose: '19:00'
    };

    it('should work tests deleteDay', async () => {
      const {_id} = await Producer._create('Food truck', 'dominoss', password, description, fields.profileImage, 1, 1, {
        merchant: {
          merchantId: '987675'
        }});
      const hour1 = await hour.create(hours.day, hours.openTime, hours.closeTime);
      const hour2 = await hour.create(hours.day, hours.openTime, hours.newClose);
      const hourArray = [];
      hourArray[0] = hour1;
      hourArray[1] = hour2;
      await Producer.addHours(_id, hourArray);
      const checkProd = await Producer.deleteDay(_id, hours.day);
      assert.equal('0', checkProd.hours.length);
    });
  });
  describe('#UpdateHours', () => {
    const fields = {
      name: 'Updated Name',
      username: 'Updated Username',
      password: 'Updated Password',
      description: 'Updated Description',
      phoneNumber: '9876543210',
      profileImage: 'www.updated.com',
      enabled: true,
      menuLink: 'www.menulink.com',
      hour: {
        day: 'Tuesday',
        openTime: '07:00',
        closeTime: '20:00'
      }
    };
    console.log('out');
    it('should work tests updateHours', async () => {
      const hours = {
        day: 'Wednesday',
        openTime: '07:00',
        newOpen: '08:00',
        closeTime: '20:00',
        newClose: '19:00'
      };
      const {_id} = await Producer._create('Food truck', 'dominoesss',
        password, description, fields.profileImage, 1, 1, {
          merchant: {
            merchantId: '987655'
          }});
      const hour1 = await hour.create(hours.day, hours.openTime, hours.closeTime);
      const hourId = hour1._id;
      const hourArray = [];
      hourArray[0] = hour1;
      await Producer.addHours(_id, hourArray);
      const prodCheck = await Producer.updateHours(_id, hourId, hours.day, hours.newOpen, hours.newClose);
      assert.equal(prodCheck.hours[prodCheck.hours.length - 1].openTime, hours.newOpen);
    });
  });
});
