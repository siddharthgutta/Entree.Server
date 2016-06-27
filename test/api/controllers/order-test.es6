import * as Order from '../../../api/controllers/order.es6';
import * as Producer from '../../../api/controllers/producer.es6';
import * as Consumer from '../../../api/controllers/consumer.es6';
import {OrderStatuses} from '../../../models/constants/order-status.es6';
import _ from 'lodash';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';
import Chance from 'chance';

const chance = new Chance();

describe('Order DB API', () => {
  const body = 'Text Body of the Order';
  let producer;
  let consumer;
  const optionalAttributes = {
    price: 1200,
    eta: 60000
  };

  beforeEach(async () => {
    await clear();
    producer = await Producer.create('Bob Restaurant', chance.string(), 'bobpass', 'bobdescription', 'www.bob.com',
      'example order', '5601 W Parker Rd', 12, 12, 'www.menulink.com');
    consumer = await Consumer.createFbConsumer('Bob Fb Id');
  });

  describe('#create()', () => {
    it('should create a basic Order object successfully', async () => {
      const order = await Order.create(body, producer._id, consumer._id);
      assert.equal(order.body, body);
      assert.equal(order.producer, producer._id);
      assert.equal(order.consumer, consumer._id);
      assert.equal(order.status, 'Pending');
    });

    it('should create a complex Order object successfully', async () => {
      const order = await Order.create(body, producer._id, consumer._id, optionalAttributes);
      assert.equal(order.body, body);
      assert.equal(order.producer, producer._id);
      assert.equal(order.consumer, consumer._id);
      assert.equal(order.status, 'Pending');
      assert.equal(order.price, optionalAttributes.price);
      assert.equal(order.eta, optionalAttributes.eta);
    });

    it('should fail to create an Order object with a non-integer price', async () => {
      try {
        await Order.create(body, producer._id, consumer._id, {price: 12.5});
      } catch (err) {
        return;
      }
      assert(false);
    });

    it('should fail to create an Order object with a negative price', async () => {
      try {
        await Order.create(body, producer._id, consumer._id, {price: -12});
      } catch (err) {
        return;
      }
      assert(false);
    });

    it('should fail to create an Order object with a non-integer eta', async () => {
      try {
        await Order.create(body, producer._id, consumer._id, {eta: 12.5});
      } catch (err) {
        return;
      }
      assert(false);
    });

    it('should fail to create an Order object with a negative eta', async () => {
      try {
        await Order.create(body, producer._id, consumer._id, {eta: -12});
      } catch (err) {
        return;
      }
      assert(false);
    });

    _.forEach(OrderStatuses, status => {
      it(`should successfully create an Order object with valid status ${status}`, async () => {
        const order = await Order.create(body, producer._id, consumer._id, {status});
        assert.equal(order.status, status);
      });
    });

    it('should fail to create an Order object with an invalid order status', async () => {
      try {
        await Order.create(body, producer._id, consumer._id, {status: 'Status That Will Never Exist'});
      } catch (err) {
        return;
      }
      assert(false);
    });
  });

  describe('#findOneByObjectId()', () => {
    it('should find a order correctly', async () => {
      const {_id} = await Order.create(body, producer._id, consumer._id, optionalAttributes);
      const order = await Order.findOneByObjectId(_id);
      assert.equal(order.body, body);
      assert.deepEqual(order.producer, producer._id);
      assert.deepEqual(order.consumer, consumer._id);
      assert.equal(order.status, 'Pending');
      assert.equal(order.price, optionalAttributes.price);
      assert.equal(order.eta, optionalAttributes.eta);
    });
  });

  describe('#updateByObjectId()', () => {
    const updatedFields = {
      body: 'new body text',
      status: 'Accepted',
      price: 15000,
      eta: 120000
    };

    it('should update a singular field successfully', async () => {
      const {_id} = await Order.create(body, producer._id, consumer._id, optionalAttributes);
      await Order.updateByObjectId(_id, {status: updatedFields.status});
      const order = await Order.findOneByObjectId(_id);
      assert.equal(order.body, body);
      assert.deepEqual(order.producer, producer._id);
      assert.deepEqual(order.consumer, consumer._id);
      assert.equal(order.status, updatedFields.status);
      assert.equal(order.price, optionalAttributes.price);
      assert.equal(order.eta, optionalAttributes.eta);
    });

    it('should set multiple fields of a order correctly', async () => {
      const origOrder = await Order.create(body, producer._id, consumer._id, optionalAttributes);
      await Order.updateByObjectId(origOrder._id, updatedFields);
      const order = await Order.findOneByObjectId(origOrder._id);
      assert.equal(order.body, updatedFields.body);
      assert.deepEqual(order.producer, producer._id);
      assert.deepEqual(order.consumer, consumer._id);
      assert.equal(order.status, updatedFields.status);
      assert.equal(order.price, updatedFields.price);
      assert.equal(order.eta, updatedFields.eta);
    });

    it('should fail to update an Order object with a non-integer price', async () => {
      try {
        const {_id} = await Order.create(body, producer._id, consumer._id, optionalAttributes);
        await Order.updateByObjectId(_id, {price: 12.5});
      } catch (err) {
        return;
      }
      assert(false);
    });

    it('should fail to update an Order object with a negative price', async () => {
      try {
        const {_id} = await Order.create(body, producer._id, consumer._id, optionalAttributes);
        await Order.updateByObjectId(_id, {price: -1});
      } catch (err) {
        return;
      }
      assert(false);
    });

    it('should fail to update an Order object with a non-integer eta', async () => {
      try {
        const {_id} = await Order.create(body, producer._id, consumer._id, optionalAttributes);
        await Order.updateByObjectId(_id, {eta: 12.5});
      } catch (err) {
        return;
      }
      assert(false);
    });

    it('should fail to update an Order object with a negative eta', async () => {
      try {
        const {_id} = await Order.create(body, producer._id, consumer._id, optionalAttributes);
        await Order.updateByObjectId(_id, {eta: -1});
      } catch (err) {
        return;
      }
      assert(false);
    });

    it('should fail to update status of an order to an invalid order status', async () => {
      try {
        const {_id} = await Order.create(body, producer._id, consumer._id, optionalAttributes);
        await Order.updateByObjectId(_id, {status: 'Status That Will Never Exist'});
      } catch (err) {
        return;
      }
      assert(false);
    });
  });

  describe('#pushOrderByObjectId()', async () => {
    function compareOrderObjects(order, orderCopy) {
      assert.deepEqual(order._id, orderCopy._id);
      assert.equal(order.body, orderCopy.body);
      assert.deepEqual(order.producer, orderCopy.producer);
      assert.deepEqual(order.consumer, orderCopy.consumer);
      assert.equal(order.status, orderCopy.status);
      assert.equal(order.price, orderCopy.price);
      assert.equal(order.eta, orderCopy.eta);
    }

    it('should push a single order to a consumer successfully', async () => {
      const order = await Order.create(body, producer._id, consumer._id, optionalAttributes);
      await Order.pushOrderByObjectId([consumer], order._id);
      const {orders: consumerOrders} = await Consumer.findOneByFbId(consumer.fbId);
      assert.equal(consumerOrders.length, 1);
      const orderCopy = await Order.findOneByObjectId(consumerOrders[0]);
      compareOrderObjects(order, orderCopy);
    });

    it('should push multiple orders to a consumer successfully', async () => {
      const order1 = await Order.create(body, producer._id, consumer._id, optionalAttributes);
      const order2 = await Order.create(body, producer._id, consumer._id, optionalAttributes);
      await Order.pushOrderByObjectId([consumer], order1._id);
      await Order.pushOrderByObjectId([consumer], order2._id);
      const {orders: consumerOrders} = await Consumer.findOneByFbId(consumer.fbId);
      assert.equal(consumerOrders.length, 2);
      const orderCopy1 = await Order.findOneByObjectId(consumerOrders[0]);
      const orderCopy2 = await Order.findOneByObjectId(consumerOrders[1]);
      compareOrderObjects(order1, orderCopy1);
      compareOrderObjects(order2, orderCopy2);
    });

    it('should push a single order to a producer successfully', async () => {
      const order = await Order.create(body, producer._id, consumer._id, optionalAttributes);
      await Order.pushOrderByObjectId([producer], order._id);
      const {orders: producerOrders} = await Producer.findOneByObjectId(producer._id);
      assert.equal(producerOrders.length, 1);
      const orderCopy = await Order.findOneByObjectId(producerOrders[0]);
      compareOrderObjects(order, orderCopy);
    });

    it('should push a multiple orders to a producer successfully', async () => {
      const order1 = await Order.create(body, producer._id, consumer._id, optionalAttributes);
      const order2 = await Order.create(body, producer._id, consumer._id, optionalAttributes);
      await Order.pushOrderByObjectId([producer], order1._id);
      await Order.pushOrderByObjectId([producer], order2._id);
      const {orders: producerOrders} = await Producer.findOneByObjectId(producer._id);
      assert.equal(producerOrders.length, 2);
      const orderCopy1 = await Order.findOneByObjectId(producerOrders[0]);
      const orderCopy2 = await Order.findOneByObjectId(producerOrders[1]);
      compareOrderObjects(order1, orderCopy1);
      compareOrderObjects(order2, orderCopy2);
    });

    it('should push a single order to both a producer and consumer successfully', async () => {
      const order = await Order.create(body, producer._id, consumer._id, optionalAttributes);
      await Order.pushOrderByObjectId([consumer, producer], order._id);
      const {orders: consumerOrders} = await Consumer.findOneByFbId(consumer.fbId);
      assert.equal(consumerOrders.length, 1);
      const orderConsumerCopy = await Order.findOneByObjectId(consumerOrders[0]);
      compareOrderObjects(order, orderConsumerCopy);
      const {orders: producerOrders} = await Producer.findOneByObjectId(producer._id);
      assert.equal(producerOrders.length, 1);
      const orderProducerCopy = await Order.findOneByObjectId(producerOrders[0]);
      compareOrderObjects(order, orderProducerCopy);
    });

    it('should push multiple orders to both a producer and consumer successfully', async () => {
      const order1 = await Order.create(body, producer._id, consumer._id, optionalAttributes);
      const order2 = await Order.create(body, producer._id, consumer._id, optionalAttributes);
      await Order.pushOrderByObjectId([consumer, producer], order1._id);
      await Order.pushOrderByObjectId([consumer, producer], order2._id);
      const {orders: consumerOrders} = await Consumer.findOneByFbId(consumer.fbId);
      assert.equal(consumerOrders.length, 2);
      const orderConsumerCopy1 = await Order.findOneByObjectId(consumerOrders[0]);
      const orderConsumerCopy2 = await Order.findOneByObjectId(consumerOrders[1]);
      compareOrderObjects(order1, orderConsumerCopy1);
      compareOrderObjects(order2, orderConsumerCopy2);
      const {orders: producerOrders} = await Producer.findOneByObjectId(producer._id);
      assert.equal(producerOrders.length, 2);
      const orderProducerCopy1 = await Order.findOneByObjectId(producerOrders[0]);
      const orderProducerCopy2 = await Order.findOneByObjectId(producerOrders[1]);
      compareOrderObjects(order1, orderProducerCopy1);
      compareOrderObjects(order2, orderProducerCopy2);
    });
  });

  describe('#findByStatusForProducer()', () => {
    function compareOrderObjects(order, orderCopy) {
      assert.deepEqual(order._id, orderCopy._id);
      assert.equal(order.body, orderCopy.body);
      assert.deepEqual(order.producer, orderCopy.producer);
      assert.deepEqual(order.consumer, orderCopy.consumer);
      assert.equal(order.status, orderCopy.status);
      assert.equal(order.price, orderCopy.price);
      assert.equal(order.eta, orderCopy.eta);
    }

    _.forEach(OrderStatuses, orderStatus => {
      it(`should find multiple orders for a producer with status ${orderStatus}`, async () => {
        const order1 = await Order.create(body, producer._id, consumer._id, {status: orderStatus});
        const order2 = await Order.create('second body text', producer._id, consumer._id, {status: orderStatus});
        await Order.pushOrderByObjectId([consumer, producer], order1._id);
        await Order.pushOrderByObjectId([consumer, producer], order2._id);
        const orders = await Order.findByStatusForProducer(producer._id, orderStatus, 2);
        assert.equal(orders.length, 2);
        const orderProducerCopy1 = await Order.findOneByObjectId(orders[0]);
        const orderProducerCopy2 = await Order.findOneByObjectId(orders[1]);
        compareOrderObjects(order1, orderProducerCopy1);
        compareOrderObjects(order2, orderProducerCopy2);
      });
    });

    _.forEach(OrderStatuses, orderStatus => {
      it(`should limit orders to oldest for a producer with status ${orderStatus}`, async () => {
        const order1 = await Order.create(body, producer._id, consumer._id, {status: orderStatus});
        const order2 = await Order.create('second body text', producer._id, consumer._id, {status: orderStatus});
        await Order.pushOrderByObjectId([consumer, producer], order1._id);
        await Order.pushOrderByObjectId([consumer, producer], order2._id);
        const orders = await Order.findByStatusForProducer(producer._id, orderStatus, 1);
        assert.equal(orders.length, 1);
        const orderProducerCopy1 = await Order.findOneByObjectId(orders[0]);
        compareOrderObjects(order1, orderProducerCopy1);
      });
    });

    it(`should not get orders with incorrect status`, async () => {
      const order1 = await Order.create(body, producer._id, consumer._id, {status: 'Pending'});
      const order2 = await Order.create('second body text', producer._id, consumer._id, {status: 'Accepted'});
      await Order.pushOrderByObjectId([consumer, producer], order1._id);
      await Order.pushOrderByObjectId([consumer, producer], order2._id);
      const orders = await Order.findByStatusForProducer(producer._id, 'Accepted', 2);
      assert.equal(orders.length, 1);
      const orderProducerCopy1 = await Order.findOneByObjectId(orders[0]);
      compareOrderObjects(order2, orderProducerCopy1);
    });
  });
});
