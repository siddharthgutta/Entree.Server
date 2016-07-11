/**
 * Created by kfu on 2/29/16.
 */

import Braintree from '../../libs/payment/braintree.es6';
import * as Consumer from './consumer.es6';
import * as Producer from './producer.es6';
import config from 'config';
import TypedSlackData from '../../libs/notifier/typed-slack-data.es6';
import braintree from 'braintree';
import * as Runtime from '../../libs/runtime.es6';
import selectn from 'selectn';
import {isEmpty} from '../../libs/utils.es6';
import * as Slack from './slack.es6';
import * as Merchant from './merchant.es6';

const slackChannelId = config.get('Slack.braintree.channelId');

// Payment Config credentials for Production or Sandbox
const productionOrSandbox = Runtime.isProduction();
const braintreeCreds = config.get(`Braintree.${productionOrSandbox ? 'production' : 'sandbox'}`);
console.log(`Braintree Init: ${productionOrSandbox}`);

/**
 * Handles the parse results from webhook notifications via braintree
 *
 * @param {braintree.WebhookNotification} webhookNotification: braintree webhook notification
 * @returns {Promise}: result of parsing the message
 */
async function handleParseResult(webhookNotification) {
  switch (webhookNotification.kind) {
    case braintree.WebhookNotification.Kind.SubMerchantAccountApproved:
      // Requiring an existing producer for a merchantId if in production mode
      if (productionOrSandbox) {
        try {
          const merchantId = webhookNotification.merchantAccount.id;
          const producerId = (await Producer.findByMerchantId(merchantId)).get().id;
          await Producer.update(producerId, {merchantApproved: true});
        } catch (err) {
          throw new Error('Could not update merchant to be approved by merchantId', err);
        }
      }
      break;
    default:
      // Future Implementations of other Parse Result cases here
      break;
  }
}

const nonProductionColor = '#3366cc';

/**
 * Notifies information from the webhook Notification
 *
 * @param {braintree.WebhookNotification} webhookNotification: braintree webhook notification
 * @returns {Null} Unused
 */
export async function notify(webhookNotification) {
  const slackData = new TypedSlackData();
  slackData.pushAttachment();
  let fallback = productionOrSandbox ? `Production\n` : `Sandbox\nTimeStamp: ${webhookNotification.timestamp}\n`;
  switch (webhookNotification.kind) {
    case braintree.WebhookNotification.Kind.SubMerchantAccountApproved:
      const dbaName = selectn('business.dbaName', webhookNotification.merchantAccount);
      slackData.setColor(productionOrSandbox ? 'good' : nonProductionColor);
      slackData.setPretext('INCOMING WEBHOOK NOTIFICATION');
      slackData.pushField('Merchant Account', `Approved`);
      slackData.pushField('Merchant Status', `${webhookNotification.merchantAccount.status}`);
      slackData.pushField('Merchant ID', `${webhookNotification.merchantAccount.id}`);
      slackData.pushField('Merchant Name', isEmpty(dbaName) ? 'Unnamed' : dbaName);
      fallback += `INCOMING WEBHOOK NOTIFICATION\nMerchant Account: Approved\n` +
        `Status: ${webhookNotification.merchantAccount.status}\n` +
        `Merchant Id: ${webhookNotification.merchantAccount.id}`;
      break;
    case braintree.WebhookNotification.Kind.SubMerchantAccountDeclined:
      slackData.setColor(productionOrSandbox ? 'danger' : nonProductionColor);
      slackData.setPretext('INCOMING WEBHOOK NOTIFICATION');
      slackData.pushField('Merchant Account', `Declined`);
      slackData.pushField('Reason Declined', `${webhookNotification.message}`);
      fallback += `INCOMING WEBHOOK NOTIFICATION\nMerchant Account: Declined\nReason: ${webhookNotification.message}`;
      break;
    case braintree.WebhookNotification.Kind.Disbursement:
      slackData.setColor(productionOrSandbox ? 'good' : nonProductionColor);
      slackData.setPretext('INCOMING WEBHOOK NOTIFICATION');
      slackData.pushField('Disbursement Status', `SUCCESS`);
      slackData.pushField('Amount', `${webhookNotification.disbursement.amount}`);
      slackData.pushField('Disbursement Id', `${webhookNotification.disbursement.id}`);
      slackData.pushField('Date of Disbursement', `${webhookNotification.disbursement.disbursementDate}`);
      slackData.pushField('Transaction Ids', `${webhookNotification.disbursement.transactionIds}`);
      slackData.pushField('Merchant Account Id', `${webhookNotification.disbursement.merchantAccount.id}`);
      slackData.pushField('First Disbursement Attempt?', `${!webhookNotification.disbursement.retry}`);
      fallback += `INCOMING WEBHOOK\nDisbursement Status: SUCCESS\n` +
        `Disbursement Id: ${webhookNotification.disbursement.id}\nAmount:${webhookNotification.disbursement.amount}` +
        `\n Merchant Id: ${webhookNotification.disbursement.merchantAccount.id}`;

      break;
    case braintree.WebhookNotification.Kind.DisbursementException:
      slackData.setColor(productionOrSandbox ? 'danger' : nonProductionColor);
      slackData.setPretext('INCOMING WEBHOOK NOTIFICATION');
      slackData.pushField('Disbursement Status', `${webhookNotification.disbursement.exceptionMessage}`);
      slackData.pushField('Amount', `${webhookNotification.disbursement.amount}`);
      slackData.pushField('Disbursement Id', `${webhookNotification.disbursement.id}`);
      slackData.pushField('Date of Disbursement', `${webhookNotification.disbursement.disbursementDate}`);
      slackData.pushField('Transaction Ids', `${webhookNotification.disbursement.transactionIds}`, false);
      slackData.pushField('Merchant Account Id', `${webhookNotification.disbursement.merchantAccount.id}`);
      slackData.pushField('First Disbursement Attempt?', `${!webhookNotification.disbursement.retry}`);
      slackData.pushField('Follow Up Action', `${webhookNotification.disbursement.followUpAction}`);
      slackData.pushField('Reason for Failed Disbursement', `${webhookNotification.disbursement.disbursementDate}`);
      fallback += `INCOMING WEBHOOK\nDisbursement Status: ${webhookNotification.disbursement.exceptionMessage}\n` +
        `Disbursement Id: ${webhookNotification.disbursement.id}\nAmount:${webhookNotification.disbursement.amount}` +
        `\n Merchant Id: ${webhookNotification.disbursement.merchantAccount.id}`;
      break;
    case braintree.WebhookNotification.Kind.TransactionDisbursed:
    // Deprecated by Payment
    default:
      slackData.setColor(productionOrSandbox ? 'warning' : nonProductionColor);
      slackData.setPretext('UNSUPPORTED WEBHOOK NOTIFICATION');
      slackData.pushField('Notification Type', `${webhookNotification.kind}`);
      fallback += `UNSUPPORTED WEBHOOK NOTIFICATION\nNotification Type: ${webhookNotification.kind}`;
      break;
  }
  slackData.setFallback(fallback);
  await Slack.sendMessage(slackChannelId, slackData);
}

/**
 * Callback to pass into payment system
 * @param {braintree.WebhookNotification} webhookNotification: braintree webhook notification
 * @returns {Null}: Unused
 */
async function handleRequest(webhookNotification) {
  notify(webhookNotification);
  await handleParseResult(webhookNotification);
}

/**
 * Payment strategy for Production or Sandbox
 * @type {Braintree}
 */
const bt = new Braintree(braintreeCreds.merchantId, braintreeCreds.publicKey,
  braintreeCreds.privateKey, braintreeCreds.masterMerchantAccountId, handleRequest);

/**
 * Initializes router
 * @returns {Router}: router to be set
 */
export function initRouter() {
  return bt.initRouter();
}

/**
 * Gets the gateway for testing purposes
 * @returns {Promise}: gateway or an error
 */
export function getGateway() {
  return bt.getGateway();
}

/**
 * Generate Client Token to pass to the client browser
 *
 * @returns {Promise}: generated client token or error
 */
export async function generateClientToken() {
  try {
    return await bt.generateClientToken();
  } catch (err) {
    throw new Error('Client Generation Token Error for generateClientToken', err);
  }
}

/**
 * Makes a real braintree payment
 *
 * @param {String} amount: string amount to pay, converted from number
 * @param {String} merchantId: merchant Id from braintree
 * @param {String} name: producer name
 * @param {String} paymentMethodToken: token gotten for a specific payment method
 * @param {String} customerId: customer Id from braintree
 * @param {String} serviceFee: string amount service fee that we take
 * @returns {Promise}: returns the transaction object if successful, error if not
 */
async function makePayment(amount, merchantId, name, paymentMethodToken, customerId, serviceFee) {
  const result = await bt.transaction(amount, merchantId, name, paymentMethodToken, customerId, serviceFee);
  if (!result.success && !isEmpty(result.errors) && !isEmpty(result.errors.deepErrors())) {
    console.error(`Validation Errors on makePayment`);
    console.error(result.errors.deepErrors());
    throw result.transaction;
  } else if (!result.success) {
    console.error(`Failed to Execute Transaction on makePayment`);
    console.error(result.transaction);
    throw result.transaction;
  } else {
    return result.transaction;
  }
}

/**
 * Create customer with Payment and execute initial transaction
 * OR add new payment for existing customer
 *
 * @param {String} consumerId: id of the consumer
 * @param {String} paymentMethodNonce: nonce from client browser
 * @returns {Promise}: result of the transaction or error
 */
export async function registerPaymentForConsumer(consumerId, paymentMethodNonce) {
  let customerResult;
  let consumer;
  try {
    consumer = await Consumer.findOneByObjectId(consumerId);
  } catch (findConsumerErr) {
    throw new Error('Failed to find Consumer by FbId for registerPaymentForConsumer', findConsumerErr);
  }
  let customerId = consumer.customerId;
  // Your payment method nonce should be different each time the submit button is hit
  // Or else you're not sending a new payment, also paymentMethodNonce should not
  // be an array of values or more than one (saw this bug when I tried another React approach)
  /*
  console.log(`Payment Method Nonce: ${paymentMethodNonce}`);
  console.log(`Phone Number: ${phone}`);
  console.log(`Customer Id: ${customerId}`);
  */
  // Check if consumer does already have a customerId - indicates that signup2 hasn't occurred
  if (isEmpty(customerId)) {
    try {
      const firstName = consumer.firstName;
      const lastName = consumer.lastName;
      customerResult = await bt.createCustomer(firstName, lastName, paymentMethodNonce);
      customerId = customerResult.customer.id;
      await Consumer.updateByObjectId(consumerId, {customerId});
    } catch (createCustomerErr) {
      console.log('Failed to Create Customer for registerPaymentForConsumer');
      console.log(createCustomerErr);
      throw createCustomerErr;
    }
  } else {
    try {
      customerResult = await bt.addNewPaymentMethod(customerId, paymentMethodNonce);
    } catch (addPaymentMethodError) {
      console.log('Failed to add new payment method to customer');
      throw addPaymentMethodError;
    }
  }
  return customerResult;
}

/**
 * Execute transaction with payment method token
 *
 * @param {Number} consumerId: id of the consumer
 * @param {String} producerId: producer ID from db
 * @param {String} paymentMethodToken: payment method token to purchase by
 * @param {Number} amount: total amount of order in cents $1.00 -> 100
 * @returns {Promise}: result of the transaction or error
 */
export async function paymentWithToken(consumerId, producerId, paymentMethodToken, amount) {
  let consumer;
  try {
    consumer = await Consumer.findOneByObjectId(consumerId);
  } catch (findConsumerErr) {
    throw new Error('Failed to find Consumer by Id for paymentWithToken', findConsumerErr);
  }
  const customerId = consumer.customerId;
  // Check if consumer does already have a customerId - indicates that signup2 hasn't occurred
  if (!customerId) {
    throw new Error('Customer Id not found for paymentWithToken');
  }

  let producer;
  try {
    producer = await Producer.findOneByObjectId(producerId);
  } catch (findProducerErr) {
    throw new Error('Failed to find producer by Id for paymentWithToken', findProducerErr);
  }

  try {
    const amountString = (amount / 100).toString();
    const serviceFeeString = (Merchant.calculateServiceFee(amount, producer.merchant.percentageFee,
                                                     producer.merchant.transactionFee) / 100).toString();
    return await makePayment(amountString, producer.merchant.merchantId, producer.name,
      paymentMethodToken, customerId, serviceFeeString);
  } catch (transactionError) {
    throw transactionError;
  }
}

/**
 * Gets default payment method in braintree for specific consumer
 *
 * @param {Number} consumerId: id of the consumer
 * @returns {Object}: object containing cardType, last4 digits, and paymentMethodToken is they exist
 */
export async function getCustomerDefaultPayment(consumerId) {
  let customer;
  try {
    customer = await Consumer.findOneByObjectId(consumerId);
  } catch (findConsumerErr) {
    throw new Error('Failed to Find Consumer in getCustomerDefaultPayment', findConsumerErr);
  }

  try {
    customer = await bt.findCustomer(customer.customerId);
  } catch (findCustomerErr) {
    throw new Error('Failed to Find Customer in getCustomerDefaultPayment', findCustomerErr);
  }

  try {
    return await bt.getDefaultPayment(customer);
  } catch (findingPaymentErr) {
    throw new Error('Failed to Find Default Payment Method in getCustomerDefaultPayment', findingPaymentErr);
  }
}

/**
 * Creates a new Payment merchant account with individual, business, and funding objects
 * These accounts will be used to release funds to
 *
 * Details of what should be passed in to these calls are of the following:
 * https://developers.braintreepayments.com/guides/marketplace/onboarding/node#terms-of-service-accepted-parameter
 * https://developers.braintreepayments.com/reference/request/merchant-account/create/node
 *
 * @param {String} producerId: producer ID from db
 * @param {Object} individual: object containing the individual business owner's information
 * @param {Object} business: object contained the business itself's information
 * @param {Object} funding: object containing necessary funding information
 * @returns {Promise}: promise containing resulting merchant account object
 */
export async function registerOrUpdateProducerWithPaymentSystem(producerId, individual, business, funding) {
  const {merchant: {merchantId}} = await Producer.findOneByObjectId(producerId);
  let merchantAccount;
  if (!isEmpty(merchantId)) {
    merchantAccount = await bt.updateMerchant(merchantId, individual, business, funding);
  } else {
    try {
      merchantAccount = await bt.createMerchant(individual, business, funding);
    } catch (createMerchantErr) {
      throw new Error('Failed to create merchant account for registerOrUpdateProducerWithPaymentSystem',
        createMerchantErr);
    }

    try {
      await Merchant.setMerchantId(merchantId, merchantAccount.id);
    } catch (producerUpdateErr) {
      throw new Error('Failed to update producer by merchant id for registerOrUpdateProducerWithPaymentSystem',
        producerUpdateErr);
    }
  }

  return merchantAccount;
}

/**
 * Gets Payment MerchantAccount object from producer id
 *
 * @param {String} producerId: producer id
 * @returns {MerchantAccount}: merchant account that exists in Payment
 */
export async function findProducerPaymentSystemInfo(producerId) {
  const {merchant: {merchantId}} = await Producer.findOneByObjectId(producerId);
  let merchantAccount;
  if (!isEmpty(merchantId)) {
    merchantAccount = await bt.findMerchant(merchantId);
  } else {
    throw new Error(`Failed to find merchantId for producer with id ${producerId}`);
  }
  return merchantAccount;
}

/**
 * Voids an existing transaction
 * Note: Transaction must be of status authorized or submittedForSettlement
 * Voiding a transaction can occur while a transaction/sale is pending
 * while refunding occurs after the transaction/sales is no longer pending/has settled
 *
 * @param {String} transactionId: transaction id for the specific transaction of the order
 * @returns {Promise}: promise containing transaction result object
 */
export async function voidPayment(transactionId) {
  const result = await bt.voidTransaction(transactionId);
  if (!result.success) {
    console.error(`Failed to void transaction of existing payment`);
    console.error(result.transaction);
    throw result.transaction;
  }
  return result.transaction;
}

/**
 * Refund an existing transaction
 * Note: Transaction must be of status settling or settled
 * Voiding a transaction can occur while a transaction/sale is pending
 * while refunding occurs after the transaction/sales is no longer pending/has settled
 *
 * @param {String} transactionId: transaction id for the specific transaction of the order
 * @returns {Promise}: promise containing transaction result object
 */
export async function refundPayment(transactionId) {
  const result = await bt.refundTransaction(transactionId);
  if (!result.success) {
    console.error(`Failed to refund transaction of existing payment`);
    console.error(result.transaction);
    throw result.transaction;
  }
  return result.transaction;
}

/**
 * Set an existing transaction as settled from submitted_for_settlement
 * NOTE: THIS IS ONLY USED FOR TESTING PURPOSES AND NOTHING ELSE
 * Payment normally does this action on their end
 *
 * @param {String} transactionId: transaction id for the specific transaction of the order
 * @returns {Promise}: promise containing transaction result object
 */
export async function setTestTransactionAsSettled(transactionId) {
  if (!Runtime.isTest()) {
    throw new Error('setTestTransactionAsSettled is only used for testing purposes and should not be used elsewhere');
  }
  const result = await bt.setTransactionAsSettled(transactionId);
  return result.transaction;
}

/**
 * Release a transaction from escrow to the producer
 * Note: Whenever we make a transaction with a producer, we make them with a merchant account,
 * but that money/transaction sale does not get sent immediately to the merchant yet.
 * We hold onto this payment (in escrow) until we are ready to release the appropriate money
 * from the transactions/sales to the producer weekly (or however regularly we choose).
 * Releasing the correct transactions per merchant is necessary to be done with this function.
 *
 * @param {String} transactionId: id transactions to be released
 * @returns {Promise} Payment transaction object from result
 */
export async function releasePaymentToProducer(transactionId) {
  const result = await bt.releaseTransactionsFromEscrow(transactionId);
  if (!result.success) {
    console.error(`Failed to release transaction payment to producer`);
    console.error(result.transaction);
    throw result.transaction;
  }
  return result.transaction;
}
