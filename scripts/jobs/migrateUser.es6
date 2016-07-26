/**
 * Created by kfu on 7/25/16.
 */

import * as Producer from '../../api/controllers/producer.es6';
import * as User from '../../api/controllers/user.es6';
import * as Utils from '../../libs/utils.es6';
import Promise from 'bluebird';
import _ from 'lodash';

/**
 * Adds linking to a specific producer
 * @param {Producer} producer: producer to add linking to
 * @param {User} user: user to be linked
 * @returns {{String: Boolean}}: key value pair with key as the producer's name and value as
 *  whether the linking succeeded
 */
async function linkUser(producer, user) {
  try {
    await Producer.updateByObjectId(producer._id, {user: user._id});
  } catch (err) {
    console.log(`Failed to link user for ${producer.name}\n${err}`);
  }
}

/**
 * Removes username and password fields for a producer
 *
 * @param {Producer} producer: producer to add linking to
 * @returns {{String: Boolean}}: key value pair with key as the producer's name and value as
 *  whether the deletion succeeded
 */
async function removeUsernameAndPasswordFields(producer) {
  const returnObj = {};
  try {
    await Producer.updateByObjectId(producer._id, {username: undefined, password: undefined});
    returnObj[producer.name] = true;
  } catch (err) {
    console.log(`Failed to delete username and password fields for ${producer.name}\n${err}`);
    returnObj[producer.name] = false;
  }
  return returnObj;
}

/**
 * Creates a user and links it to the producer, removes existing fields
 *
 * @param {Producer} producer: producer to do linking on
 * @returns {Null}: unused
 */
async function linkAndRemove(producer) {
  const returnObj = {};
  try {
    const {username, password} = producer;
    const user = await User.create(username, password);
    await linkUser(producer, user);
    await removeUsernameAndPasswordFields(producer);
    returnObj[producer.name] = true;
  } catch (err) {
    console.log(`Failed to link and delete username and password fields for ${producer.name}\n${err}`);
    returnObj[producer.name] = false;
  }
  return returnObj;
}

/**
 * Adds or links users to producers that don't have users
 * @returns {Null} Unused
 */
async function addOrLinkUserIfDNE() {
  let emptyFieldsEmptyUser = 0;
  let existingFieldsEmptyUser = 0;
  let emptyFieldsExistingUser = 0;
  let existingFieldsExistingUser = 0;

  const producers = await Producer.findAll();
  const total = producers.length;

  const linkingPromises = [];
  const removalPromises = [];
  for (let index = 0; index < producers.length; index++) {
    const producer = producers[index].toJSON();
    if (Utils.isEmpty(producer.user) && Utils.isEmpty(producer.username)) {
      console.log(`${producer.name} has no username/password fields and no user!`);
      emptyFieldsEmptyUser++;
    } else if (Utils.isEmpty(producer.user)) {
      console.log(`${producer.name} has fields but no user... Creating User`);
      linkingPromises.push(linkAndRemove(producer));
      existingFieldsEmptyUser++;
    } else if (Utils.isEmpty(producer.username)) {
      console.log(`${producer.name} has user but no fields... Doing Nothing`);
      emptyFieldsExistingUser++;
    } else {
      console.log(`${producer.name} has fields and has user... Removing fields`);
      removalPromises.push(removeUsernameAndPasswordFields(producer));
      existingFieldsExistingUser++;
    }
  }

  // Waits for all promises to execute
  const linkingResults = await Promise.all(linkingPromises);
  let successfulLinking = 0;
  let failedLinking = 0;

  console.log(`-------------------`);
  console.log(`Linking Results`);
  console.log(`-------------------`);
  _.forEach(linkingResults, linkingResult => {
    for (const producerName in linkingResult) { // eslint-disable-line
      const statusString = linkingResult[producerName] ? 'SUCCESS' : 'FAILED';
      if (linkingResult[producerName]) {
        successfulLinking++;
      } else {
        failedLinking++;
      }
      console.log(`${producerName}: ${statusString}`);
    }
  });

  const removalResults = await Promise.all(removalPromises);
  let successfulRemovals = 0;
  let failedRemovals = 0;

  console.log(`-------------------`);
  console.log(`Removal Results`);
  console.log(`-------------------`);
  _.forEach(removalResults, removalResult => {
    for (const producerName in removalResult) { // eslint-disable-line
      const statusString = removalResult[producerName] ? 'SUCCESS' : 'FAILED';
      if (removalResult[producerName]) {
        successfulRemovals++;
      } else {
        failedRemovals++;
      }
      console.log(`${producerName}: ${statusString}`);
    }
  });

  console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~`);
  console.log(`Total Producers: ${total}`);
  console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~`);
  console.log(`Empty Fields Empty Users ${emptyFieldsEmptyUser}`);
  console.log(`Existing Fields Empty Users ${existingFieldsEmptyUser}`);
  console.log(`Empty Fields Existing Users ${emptyFieldsExistingUser}`);
  console.log(`Existing Fields Existing Users ${existingFieldsExistingUser}`);
  console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
  console.log(`Linking Successes: ${successfulLinking}`);
  console.log(`Linking Failed: ${failedLinking}`);
  console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
  console.log(`Removal Successes: ${successfulRemovals}`);
  console.log(`Removal Failed: ${failedRemovals}`);
}

addOrLinkUserIfDNE();
