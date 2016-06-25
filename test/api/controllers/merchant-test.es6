/**
 * Created by kfu on 6/24/16.
 */

import * as Merchant from '../../../api/controllers/merchant.es6';
import {clear} from '../../../models/mongo/index.es6';
import assert from 'assert';
import mongoose from 'mongoose';

describe('Merchant DB API', () => {
  const attributes = {
    percentageFee: 12.5,
    transactionFee: 30
  };
  const merchantId = 'abcdef';

  beforeEach(async () => {
    await clear();
  });

  describe('#create()', () => {
    it('should create a Merchant object successfully', async () => {
      const merchant = await Merchant.create(attributes.percentageFee, attributes.transactionFee);
      assert.equal(merchant.percentageFee, attributes.percentageFee);
      assert.equal(merchant.transactionFee, attributes.transactionFee);
      assert.equal(merchant.approved, false);
    });

    it('should create a Merchant object with merchantId successfully', async () => {
      const merchant = await Merchant.create(attributes.percentageFee, attributes.transactionFee, {merchantId});
      assert.equal(merchant.percentageFee, attributes.percentageFee);
      assert.equal(merchant.transactionFee, attributes.transactionFee);
      assert.equal(merchant.merchantId, merchantId);
      assert.equal(merchant.approved, false);
    });

    it('should fail to create a Merchant with no transaction fee', async () => {
      try {
        await Merchant.create(attributes.percentageFee);
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Merchant with no percentage fee', async () => {
      try {
        await Merchant.create(null, attributes.transactionFee);
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Merchant with a non-integer transaction fee', async () => {
      try {
        await Merchant.create(attributes.percentageFee, 12.5);
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Merchant with a negative percentage Fee', async () => {
      try {
        await Merchant.create(-1, attributes.transactionFee);
      } catch (e) {
        return;
      }
      assert(false);
    });

    it('should fail to create a Merchant with a percentage Fee greater than 100', async () => {
      try {
        await Merchant.create(101, attributes.transactionFee);
      } catch (e) {
        return;
      }
      assert(false);
    });
  });

  describe('#findOneByObjectId()', () => {
    it('should find a merchant correctly', async () => {
      const merchant = await Merchant.create(attributes.percentageFee, attributes.transactionFee);
      const sameMerchant = await Merchant.findOneByObjectId(merchant._id);
      assert.equal(merchant.percentageFee, sameMerchant.percentageFee);
      assert.equal(merchant.transactionFee, sameMerchant.transactionFee);
      assert.equal(merchant.approved, sameMerchant.approved);
    });

    it('should error if nothing is found', async () => {
      try {
        await Merchant.findOneByObjectId(mongoose.Types.ObjectId()); // eslint-disable-line
      } catch (err) {
        return;
      }
      assert(false);
    });
  });

  describe('#setMerchantId()', () => {
    it('should set a merchantId correctly', async () => {
      const {_id} = await Merchant.create(attributes.percentageFee, attributes.transactionFee);
      await Merchant.setMerchantId(_id, merchantId);
      const merchant = await Merchant.findOneByObjectId(_id);
      assert.equal(merchant.merchantId, merchantId);
    });

    it('should not allow non-unique merchantIds', async () => {
      try {
        const {_id} = await Merchant.create(attributes.percentageFee, attributes.transactionFee);
        await Merchant.setMerchantId(_id, merchantId);
        const {_id2} = await Merchant.create(attributes.percentageFee, attributes.transactionFee);
        await Merchant.setMerchantId(_id2, merchantId);
      } catch (err) {
        return;
      }
      assert(false);
    });

    it('should not allow an empty string merchantId', async () => {
      try {
        const {_id} = await Merchant.create(attributes.percentageFee, attributes.transactionFee);
        await Merchant.setMerchantId(_id, '');
      } catch (err) {
        return;
      }
      assert(false);
    });

    it('should not allow a string merchantId longer than 32 characters', async () => {
      try {
        const {_id} = await Merchant.create(attributes.percentageFee, attributes.transactionFee);
        await Merchant.setMerchantId(_id, '123456789012345678901234567890123');
      } catch (err) {
        return;
      }
      assert(false);
    });

    describe('#findOneByMerchantId', () => {
      it('should successfully find the merchant by merchantId', async () => {
        const {_id} = await Merchant.create(attributes.percentageFee, attributes.transactionFee);
        await Merchant.setMerchantId(_id, merchantId);
        const merchant = await Merchant.findOneByObjectId(_id);
        const merchant2 = await Merchant.findOneByMerchantId(merchantId);
        assert.equal(merchant.percentageFee, merchant2.percentageFee);
        assert.equal(merchant.transactionFee, merchant2.transactionFee);
        assert.equal(merchant.approved, merchant2.approved);
        assert.equal(merchant.merchantId, merchant2.merchantId);
        assert.deepEqual(merchant._id, merchant2._id);
      });

      it('should error when trying to find a merchant by non-existent merchantId', async () => {
        try {
          await Merchant.findOneByMerchantId(merchantId);
        } catch (err) {
          return;
        }
        assert(false);
      });
    });
  });
});
