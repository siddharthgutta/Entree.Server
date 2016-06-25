/**
 * Created by kfu on 6/24/16.
 */

import * as Context from '../../../api/controllers/context.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';
import mongoose from 'mongoose';

describe('Context DB API', () => {
  const attributes = {
    lastAction: 'some action',
    producerId: mongoose.Schema.Types.ObjectId() // eslint-disable-line
  };

  beforeEach(async () => {
    await clear();
  });

  describe('#create()', () => {
    it('should create an empty Context object successfully', async () => {
      const context = await Context.create();
      assert.equal(context.lastAction, undefined);
      assert.equal(context.producerId, undefined);
    });

    it('should create a Context object with attributes successfully', async () => {
      const context = await Context.create(attributes);
      assert.equal(context.lastAction, attributes.lastAction);
      assert.equal(context.producerId, attributes.producerId);
    });
  });

  describe('#findOneByObjectId', () => {
    it('should create an empty Context object successfully', async () => {
      const {_id} = await Context.create(attributes);
      const context = await Context.findOneByObjectId(_id);
      assert.equal(context.lastAction, attributes.lastAction);
      assert.equal(context.producerId, attributes.producerId);
    });
  });

  describe('#emptyFields()', () => {
    it('should empty singular field correctly', async () => {
      const {_id} = await Context.create(attributes);
      await Context.emptyFields(_id, ['lastAction']);
      const context = await Context.findOneByObjectId(_id);
      assert.equal(context.lastAction, undefined);
      assert.equal(context.producerId, attributes.producerId);
    });

    it('should empty multiple fields correctly', async () => {
      const {_id} = await Context.create(attributes);
      await Context.emptyFields(_id, ['lastAction', 'producerId']);
      const context = await Context.findOneByObjectId(_id);
      assert.equal(context.lastAction, undefined);
      assert.equal(context.producerId, undefined);
    });
  });

  describe('#updateFields()', () => {
    const updatedFields = {
      lastAction: 'newAction',
      producerId: mongoose.Schema.Types.ObjectId() // eslint-disable-line
    };

    it('should update singular field correctly', async () => {
      const {_id} = await Context.create(attributes);
      await Context.updateFields(_id, {lastAction: updatedFields.lastAction});
      const context = await Context.findOneByObjectId(_id);
      assert.equal(context.lastAction, updatedFields.lastAction);
      assert.equal(context.producerId, attributes.producerId);
    });

    it('should updated multiple fields correctly', async () => {
      const {_id} = await Context.create(attributes);
      await Context.updateFields(_id, updatedFields);
      const context = await Context.findOneByObjectId(_id);
      assert.equal(context.lastAction, updatedFields.lastAction);
      assert.deepEqual(context.producerId, updatedFields.producerId);
    });
  });
});
