/**
 * Created by kfu on 3/4/16.
 */

import * as Payment from '../../../api/controllers/payment.es6';
import Braintree from '../../../libs/payment/braintree.es6';
import {isEmpty} from '../../../libs/utils.es6';
import * as Consumer from '../../../api/controllers/consumer.es6';
import * as Producer from '../../../api/controllers/producer.es6';
import * as Location from '../../../api/controllers/location.es6';
import assert from 'assert';
import {clear} from '../../../models/mongo/index.es6';
import _ from 'lodash';
import braintree from 'braintree';
import config from 'config';
import * as Runtime from '../../../libs/runtime.es6';
import shortid from 'shortid';

describe('Braintree', () => {
  beforeEach(async () => {
    await clear();
  });

  let consumerId;
  let producerId;
  const percentageFee = 12.5;
  const transactionFee = 30;
  // Customer Fields
  const firstName = 'Bob';
  const lastName = 'Smith';

  // Producer Fields
  const name = 'TestProducer';
  const username = 'testproducer';
  const password = '1234';
  const description = 'some description';
  const lat = 30.2811459;
  const long = -97.74176779999999;
  const phoneNumber = '1234567890';
  const profileImage = 'www.image.com';
  const exampleOrder = 'This is an example order';
  const enabled = true;

  // Generated from previous merchant creations
  // NOTE: Sub Merchant accounts can only be created via the API
  // See https://sandbox.braintreegateway.com/merchants/ztyv8k2ffxjky29g/merchant_accounts
  const merchantId = 'approve_me_lastname_ins_4hrzrnvy';

  describe('#generateClientToken', () => {
    it('token generation', async () => {
      const clientToken = await Payment.generateClientToken();
      assert(!isEmpty(clientToken));
    });

    it('multiple token generation', async () => {
      const clientToken1 = await Payment.generateClientToken();
      const clientToken2 = await Payment.generateClientToken();
      assert(!isEmpty(clientToken1));
      assert(!isEmpty(clientToken2));
    });
  });

  describe('Payment', () => {
    beforeEach(async () => {
      const consumer = (await Consumer.createFbConsumer(shortid.generate(), {firstName, lastName}));
      consumerId = consumer._id;

      const location = await Location.createWithCoord(lat, long);
      const producer = await Producer._create(name, username, password, description, profileImage, exampleOrder,
        location, percentageFee, transactionFee, {producer: {phoneNumber, enabled}, merchant: {merchantId}});
      producerId = producer._id;
    });

    const validNonce = 'fake-valid-nonce';

    function calculateServiceFee(orderTotal) {
      return Math.round(orderTotal * percentageFee / 100 + transactionFee);
    }

    const authorizedAmount = 100000; // $1000 or 100,000 cents
    const processorDeclinedAmount = 300000; // $3000 or 300,000 cents
    const gatewayRejectedAmount = 500100; // $5001.00 or 500,100 cents

    describe('#paymentWithToken', () => {
      it('valid nonce should create transaction successfully', async () => {
        await Payment.updateDefaultConsumerPayment(consumerId, validNonce);
        const defaultPayment = await Payment.getCustomerDefaultPayment(consumerId);
        const transaction = await Payment.paymentWithToken(consumerId, producerId,
          defaultPayment.token, authorizedAmount);
        assert.deepEqual((authorizedAmount / 100), parseFloat(transaction.amount));
        assert.deepEqual((calculateServiceFee(authorizedAmount) / 100), parseFloat(transaction.serviceFeeAmount));
        assert.deepEqual('submitted_for_settlement', transaction.status);
      });

      it('declined processor should fail with processor response code', async () => {
        try {
          await Payment.updateDefaultConsumerPayment(consumerId, validNonce);
          const defaultPayment = await Payment.getCustomerDefaultPayment(consumerId);
          await Payment.paymentWithToken(consumerId, producerId,
            defaultPayment.token, processorDeclinedAmount);
        } catch (err) {
          const transaction = err;
          assert.deepEqual((processorDeclinedAmount / 100), parseFloat(transaction.amount));
          assert.deepEqual((calculateServiceFee(processorDeclinedAmount) / 100),
            parseFloat(transaction.serviceFeeAmount));
          assert.deepEqual('failed', transaction.status);
          assert.deepEqual(processorDeclinedAmount / 100, parseFloat(transaction.processorResponseCode));
          return;
        }
        assert(false);
      });

      it('gateway rejected should fail', async () => {
        try {
          await Payment.updateDefaultConsumerPayment(consumerId, validNonce);
          const defaultPayment = await Payment.getCustomerDefaultPayment(consumerId);
          await Payment.paymentWithToken(consumerId, producerId,
            defaultPayment.token, gatewayRejectedAmount);
        } catch (err) {
          const transaction = err;
          assert.deepEqual((gatewayRejectedAmount / 100), parseFloat(transaction.amount));
          assert.deepEqual((calculateServiceFee(gatewayRejectedAmount) / 100),
            parseFloat(transaction.serviceFeeAmount));
          assert.deepEqual('gateway_rejected', transaction.status);
        }
      });
    });

    describe('#updateDefaultConsumerPayment', () => {
      const gatewayRejectedNonces = [
        {
          nonce: 'fake-luhn-invalid-nonce',
          attribute: 'number',
          code: '81715',
          message: 'Credit card number is invalid.'
        },
        {
          nonce: 'fake-consumed-nonce',
          attribute: 'payment_method_nonce',
          code: '93107',
          message: 'Cannot use a payment_method_nonce more than once.'
        }
      ];

      _.forEach(gatewayRejectedNonces, ({nonce, attribute, code, message}) => {
        it(`${nonce} should fail with gateway rejected`, async () => {
          try {
            await Payment.updateDefaultConsumerPayment(consumerId, nonce);
          } catch (transactionErr) {
            const deepErrors = transactionErr.errors.deepErrors();
            const matchingError = _.find(deepErrors, {attribute, code, message});
            // Check if matching error was found
            assert.ok(matchingError);
            return;
          }
          assert(false);
        });
      });
    });

    describe('#getCustomerDefaultPayment', () => {
      const ccNonces = {
        processorRejected: [
          {
            nonce: 'fake-processor-declined-visa-nonce',
            cardType: 'Visa'
          },
          {
            nonce: 'fake-processor-declined-amex-nonce',
            cardType: 'American Express'
          },
          {
            nonce: 'fake-processor-declined-mastercard-nonce',
            cardType: 'MasterCard'
          },
          {
            nonce: 'fake-processor-declined-discover-nonce',
            cardType: 'Discover'
          }
        ],
        valid: [
          {
            nonce: 'fake-valid-visa-nonce',
            cardType: 'Visa'
          },
          {
            nonce: 'fake-valid-amex-nonce',
            cardType: 'American Express'
          },
          {
            nonce: 'fake-valid-mastercard-nonce',
            cardType: 'MasterCard'
          },
          {
            nonce: 'fake-valid-discover-nonce',
            cardType: 'Discover'
          }
        ]
      };

      _.forEach(ccNonces.processorRejected, ({nonce, cardType}) => {
        it(`${nonce} should fail with processor declined`, async () => {
          try {
            await Payment.updateDefaultConsumerPayment(consumerId, nonce);
          } catch (transactionErr) {
            const verification = transactionErr.verification;
            assert.deepEqual('processor_declined', verification.status);
            assert.deepEqual(verification.creditCard.cardType, cardType);
            try {
              await Payment.getCustomerDefaultPayment(consumerId);
            } catch (err) {
              // Should not be able to find customer
              return;
            }
          }
          assert(false);
        });
      });

      _.forEach(ccNonces.valid, ({nonce, cardType}) => {
        it(`${nonce} should succeed to create a default payment of ${cardType}`, async () => {
          await Payment.updateDefaultConsumerPayment(consumerId, nonce);
          let defaultPayment = await Payment.getCustomerDefaultPayment(consumerId);
          const transaction = await Payment.paymentWithToken(consumerId, producerId,
            defaultPayment.token, authorizedAmount);
          assert.deepEqual((authorizedAmount / 100), parseFloat(transaction.amount));
          assert.deepEqual((calculateServiceFee(authorizedAmount) / 100), parseFloat(transaction.serviceFeeAmount));
          assert.deepEqual('submitted_for_settlement', transaction.status);
          defaultPayment = await Payment.getCustomerDefaultPayment(consumerId);
          assert.deepEqual(defaultPayment.cardType, cardType);
        });
      });

      it('multiple payments added should reflect default payment methods', async done => {
        // Customer Fields
        const consumerId2 = (await Consumer.createFbConsumer(shortid.generate(), {firstName, lastName}))._id;
        for (let i = 0; i < ccNonces.valid.length; i++) {
          const {nonce, cardType} = ccNonces.valid[i];
          await Payment.updateDefaultConsumerPayment(consumerId2, nonce);
          const defaultPayment = await Payment.getCustomerDefaultPayment(consumerId2);
          const transaction = await Payment.paymentWithToken(consumerId2, producerId,
            defaultPayment.token, authorizedAmount);
          assert.deepEqual(transaction.creditCard.cardType, cardType, 'Transaction Card Type Incorrect');
          assert.deepEqual((authorizedAmount / 100), parseFloat(transaction.amount));
          assert.deepEqual((calculateServiceFee(authorizedAmount) / 100), parseFloat(transaction.serviceFeeAmount));
          assert.deepEqual('submitted_for_settlement', transaction.status);
          const defaultPayment2 = await Payment.getCustomerDefaultPayment(consumerId2);
          assert.deepEqual(defaultPayment2.cardType, cardType);
          if (i === 3) {
            done();
          }
        }
      });

      it(`should succeed with multiple times for multiple payments`, async () => {
        await Payment.updateDefaultConsumerPayment(consumerId, ccNonces.valid[0].nonce);
        const defaultPayment = await Payment.getCustomerDefaultPayment(consumerId);
        const transaction = await Payment.paymentWithToken(consumerId, producerId,
          defaultPayment.token, authorizedAmount);
        assert.deepEqual((authorizedAmount / 100), parseFloat(transaction.amount));
        assert.deepEqual((calculateServiceFee(authorizedAmount) / 100), parseFloat(transaction.serviceFeeAmount));
        assert.deepEqual('submitted_for_settlement', transaction.status);
        const defaultPayment2 = await Payment.getCustomerDefaultPayment(consumerId);
        assert.deepEqual(defaultPayment2.cardType, ccNonces.valid[0].cardType);
        await Payment.paymentWithToken(consumerId, producerId, defaultPayment2.token, authorizedAmount);
      });
    });

    describe('#voidPayment', () => {
      it('#voidPayment should successfully void payment', async () => {
        await Payment.updateDefaultConsumerPayment(consumerId, validNonce);
        const defaultPayment = await Payment.getCustomerDefaultPayment(consumerId);
        const transaction = await Payment.paymentWithToken(consumerId, producerId,
          defaultPayment.token, authorizedAmount);
        assert.deepEqual((authorizedAmount / 100), parseFloat(transaction.amount));
        assert.deepEqual((calculateServiceFee(authorizedAmount) / 100), parseFloat(transaction.serviceFeeAmount));
        assert.deepEqual('submitted_for_settlement', transaction.status);
        const voidedTransaction = await Payment.voidPayment(transaction.id);
        assert.deepEqual(voidedTransaction.status, 'voided');
      });
    });

    describe('#updateDefaultConsumerPayment', () => {
      it('#updateDefaultConsumerPayment should be settleable', async () => {
        await Payment.updateDefaultConsumerPayment(consumerId, validNonce);
        const defaultPayment = await Payment.getCustomerDefaultPayment(consumerId);
        const transaction = await Payment.paymentWithToken(consumerId, producerId,
          defaultPayment.token, authorizedAmount);
        assert.deepEqual((authorizedAmount / 100), parseFloat(transaction.amount));
        assert.deepEqual((calculateServiceFee(authorizedAmount) / 100), parseFloat(transaction.serviceFeeAmount));
        assert.deepEqual('submitted_for_settlement', transaction.status);
        const settledTransaction = await Payment.setTestTransactionAsSettled(transaction.id);
        assert.deepEqual('settled', settledTransaction.status);
      });
    });

    describe('#refundPayment', () => {
      it('#refundPayment should successfully refund payment', async () => {
        await Payment.updateDefaultConsumerPayment(consumerId, validNonce);
        const defaultPayment = await Payment.getCustomerDefaultPayment(consumerId);
        const transaction = await Payment.paymentWithToken(consumerId, producerId,
          defaultPayment.token, authorizedAmount);
        assert.deepEqual((authorizedAmount / 100), parseFloat(transaction.amount));
        assert.deepEqual((calculateServiceFee(authorizedAmount) / 100), parseFloat(transaction.serviceFeeAmount));
        assert.deepEqual('submitted_for_settlement', transaction.status);
        const settledTransaction = await Payment.setTestTransactionAsSettled(transaction.id);
        assert.deepEqual('settled', settledTransaction.status);
        const refundedTransaction = await Payment.refundPayment(transaction.id);
        assert.deepEqual('submitted_for_settlement', refundedTransaction.status);
        assert.deepEqual('credit', refundedTransaction.type);
        assert.notEqual(transaction.id, refundedTransaction.id);
      });
    });

    describe('#releasePaymentToProducer', () => {
      it('#releasePaymentToProducer should successfully release payment to producer', async () => {
        await Payment.updateDefaultConsumerPayment(consumerId, validNonce);
        const defaultPayment = await Payment.getCustomerDefaultPayment(consumerId);
        const transaction = await Payment.paymentWithToken(consumerId, producerId,
          defaultPayment.token, authorizedAmount);
        assert.deepEqual((authorizedAmount / 100), parseFloat(transaction.amount));
        assert.deepEqual((calculateServiceFee(authorizedAmount) / 100), parseFloat(transaction.serviceFeeAmount));
        assert.deepEqual('submitted_for_settlement', transaction.status);
        const settledTransaction = await Payment.setTestTransactionAsSettled(transaction.id);
        assert.deepEqual('settled', settledTransaction.status);
        const releasedPayment = await Payment.releasePaymentToProducer(transaction.id);
        assert.deepEqual('settled', releasedPayment.status);
        assert.deepEqual('release_pending', releasedPayment.escrowStatus);
        assert.deepEqual(transaction.id, releasedPayment.id);
      });
    });
  });

  describe('#registerOrUpdateProducerWithPaymentSystem', () => {
    const masterMerchantAccountId = config.get('Braintree.sandbox.masterMerchantAccountId');
    function createIndividual(approved) {
      return {
        firstName: approved ? braintree.Test.MerchantAccountTest.Approve :
          braintree.ValidationErrorCodes.MerchantAccount.ApplicantDetails.DeclinedOFAC,
        lastName: 'LastName',
        dateOfBirth: '1980-10-01',
        email: 'test@textentree.com',
        address: {
          streetAddress: '1234 Test St.',
          locality: 'Austin',
          region: 'TX',
          postalCode: '78705'
        }
      };
    }

    const individual2 = {
      firstName: braintree.Test.MerchantAccountTest.Approve,
      lastName: 'SecondLastName',
      dateOfBirth: '1950-01-01',
      email: 'test2@textentree.com',
      address: {
        streetAddress: '5678 Test St.',
        locality: 'Mountain View',
        region: 'CA',
        postalCode: '94035'
      }
    };

    const funding = {
      descriptor: 'test',
      destination: 'bank',
      accountNumber: '1123581321',
      routingNumber: '071101307'
    };

    it('creating declined merchant account should fail', async () => {
      const location = await Location.createWithCoord(lat, long);
      const {_id: testProducerId} = (await Producer._create(name, username, password, description, profileImage,
        exampleOrder, location, percentageFee, transactionFee, {producer: {phoneNumber, enabled}}));
      const individual = createIndividual(false);
      const merchantAccount = await Payment.registerOrUpdateProducerWithPaymentSystem(
        testProducerId, individual, {}, funding);
      assert.deepEqual(merchantAccount.status, 'suspended');
      assert.deepEqual(merchantAccount.subMerchantAccount, true);
      assert.ok(merchantAccount.masterMerchantAccount);
      assert.deepEqual(merchantAccount.masterMerchantAccount.id, masterMerchantAccountId);
    });

    it('creating approved merchant account should succeed', async () => {
      const location = await Location.createWithCoord(lat, long);
      const {_id: testProducerId} = (await Producer._create(name, username, password, description, profileImage,
        exampleOrder, location, percentageFee, transactionFee, {producer: {phoneNumber, enabled}}));
      const individual = createIndividual(true);
      let merchantAccount = await Payment.registerOrUpdateProducerWithPaymentSystem(
        testProducerId, individual, {}, funding);
      assert.deepEqual(merchantAccount.status, 'pending');
      assert.deepEqual(merchantAccount.subMerchantAccount, true);
      assert.ok(merchantAccount.masterMerchantAccount);
      assert.deepEqual(merchantAccount.masterMerchantAccount.id, masterMerchantAccountId);
      merchantAccount = await Payment.findProducerPaymentSystemInfo(testProducerId);
      const resultIndividual = _.pick(merchantAccount.individual, ...(_.keys(individual)));
      assert.deepEqual(resultIndividual, individual);
    });

    it('updating merchant account should succeed', async () => {
      const location = await Location.createWithCoord(lat, long);
      const {_id: testProducerId} = (await Producer._create(name, username, password, description, profileImage,
        exampleOrder, location, percentageFee, transactionFee, {producer: {phoneNumber, enabled},
          merchant: {merchantId}}));
      const individual = createIndividual(true);
      await Payment.registerOrUpdateProducerWithPaymentSystem(
        testProducerId, individual, {}, funding);
      const merchantAccount = await Payment.registerOrUpdateProducerWithPaymentSystem(
        testProducerId, individual2, {}, {});
      assert.deepEqual(merchantAccount.status, 'active');
      const resultIndividual = _.pick(merchantAccount.individual, ...(_.keys(individual2)));
      assert.deepEqual(resultIndividual, individual2);
    });
  });

  describe('webhooks', () => {
    function createBraintree() {
      // Payment Config credentials for Production or Sandbox
      const productionOrSandbox = Runtime.isProduction();
      const braintreeCreds = config.get(`Braintree.${productionOrSandbox ? 'production' : 'sandbox'}`);
      return new Braintree(braintreeCreds.merchantId, braintreeCreds.publicKey,
          braintreeCreds.privateKey, braintreeCreds.masterMerchantAccountId, async () => 0);
    }

    it('should fail with subscription since not implemented yet', async () => {
      const bt = createBraintree();
      const sampleNotification = Payment.getGateway().webhookTesting.sampleNotification(
        braintree.WebhookNotification.Kind.SubscriptionWentPastDue,
        'myId'
      );
      await bt._parseRequest(sampleNotification.bt_signature, sampleNotification.bt_payload);
    });

    it('should succeed with sample merchant account approved', async () => {
      const bt = createBraintree();
      const sampleNotification = Payment.getGateway().webhookTesting.sampleNotification(
        braintree.WebhookNotification.Kind.SubMerchantAccountApproved,
        'myId'
      );
      await bt._parseRequest(sampleNotification.bt_signature, sampleNotification.bt_payload);
    });

    it('should succeed with sample merchant account declined', async () => {
      const bt = createBraintree();
      const sampleNotification = Payment.getGateway().webhookTesting.sampleNotification(
        braintree.WebhookNotification.Kind.SubMerchantAccountDeclined,
        'myId'
      );
      await bt._parseRequest(sampleNotification.bt_signature, sampleNotification.bt_payload);
    });
  });
});
