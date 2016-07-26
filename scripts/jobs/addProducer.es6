/**
 * Created by kfu on 6/26/16.
 */

import * as Producer from '../../api/controllers/producer.es6';
import * as User from '../../api/controllers/user.es6';
import Promise from 'bluebird';
import fs from 'fs';
import _ from 'lodash';
import * as Utils from '../../libs/utils.es6';

/**
 * Gets the JSON from the file
 * @param {String} file: file name
 * @returns {Promise}: promise containing the parsed JSON or an error
 */
function getJSONFromFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(`./producers/${file}`, 'utf8', (readFileErr, data) => {
      if (readFileErr) {
        console.log(`Error reading [${file}] | ${readFileErr}`);
        reject(readFileErr);
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (parsingErr) {
          console.log(`Error parsing [${file}] | ${parsingErr}`);
          reject(parsingErr);
        }
      }
    });
  });
}

// Generates the requests for all JSON files
const requests = [];
const fileNames = fs.readdirSync('./producers/');

// Use this for logging
// console.log(fileNames);
_.forEach(fileNames, file => {
  requests.push(getJSONFromFile(file));
});

/**
 * Insert JSON objects for producers in the database
 * @param {Object} JSONObject for the producer
 * @returns {Boolean}: created/updated - true/false
 */
async function insertInDB(JSONObject) {
  const {name, username, password, description, profileImage, exampleOrder, address,
    percentageFee, transactionFee, optional, hours} = JSONObject;
  try {
    let _id;
    try {
      const producer = await Producer.findOneByUsername(username);
      _id = producer._id;
    } catch (findOneByUsernameErr) {
      // Temporary try catch to prevent duplicate producers from being created
      console.log(`Could not find producer by username [${username}] in user subdocument`);
      try {
        const producer = await Producer.findOneByUsernameField(username);
        _id = producer._id;
      } catch (findOneByUsernameFieldErr) {
        console.log(`Could not find producer by username [${username}] in username field`);
        throw findOneByUsernameFieldErr;
      }
    }

    console.log(`Found existing producer by username: |${username}|. Updating producer...`);
    try {
      await Producer.updateByObjectId(_id, {name, description, percentageFee,
        transactionFee, profileImage, exampleOrder, address});
    } catch (errUpdating) {
      console.log(`Error with updating ${errUpdating}`);
      throw errUpdating;
    }

    const {_id: userId} = await User.findByUsername(username);
    try {
      await User.updateByObjectId(userId, {password});
    } catch (userUpdateErr) {
      console.log(`Error with updating user ${userUpdateErr}`);
      throw userUpdateErr;
    }

    try {
      await Producer.deleteAllHours(_id);
    } catch (deleteAllHours) {
      console.log(`Delete All Hours ${deleteAllHours}`);
      throw deleteAllHours;
    }
    try {
      await Producer.addHours(_id, hours);
    } catch (addHoursErr) {
      console.log(`Add Hours ${addHoursErr}`);
      throw addHoursErr;
    }
    if (!Utils.isEmpty(optional.producer)) {
      await Producer.updateByObjectId(_id, optional.producer);
    }
  } catch (err) {
    console.log(err);
    console.log(`Could not find existing producer by username: ${username}. Creating new producer...`);
    try {
      await Producer.create(name, username, password, description, profileImage, exampleOrder, address,
        percentageFee, transactionFee, optional);
      const producer = await Producer.findOneByUsername(username);
      await Producer.addHours(producer._id, hours);
      return true;
    } catch (producerCreateError) {
      console.log(producerCreateError);
      console.log(`Could not create producer ${username} for some reason...`);
      return null;
    }
  }
  return false;
  // Use this for logging
  // const producer = await Producer.findOneByUsername(username);
  // console.log(producer);
}

/**
 * Handles JSON file adding to the database
 * @param {Array<Promise>} promises: JSON promises
 * @returns {Null}: unused
 */
async function handleJSONFile(promises) {
  try {
    const results = await Promise.all(promises);
    const insertInDbPromises = [];
    _.forEach(results, JSONObj => {
      insertInDbPromises.push(insertInDB(JSONObj));
    });
    const createdOrUpdatedResults = await Promise.all(insertInDbPromises);
    let created = 0;
    let updated = 0;
    let failed = 0;
    _.forEach(createdOrUpdatedResults, createdOrUpdated => {
      if (createdOrUpdated) created += 1;
      else if (createdOrUpdated === null) failed += 1;
      else updated += 1;
    });
    console.log(`Finished adding or updating ${fileNames.length} producers: ${fileNames}`);
    console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
    console.log(`Updated ${updated} producers`);
    console.log(`Created ${created} producers`);
    console.log(`Failed ${failed} producers`);
    console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
  } catch (err) {
    console.log(`Error adding producers: ${err}`);
  }
}

handleJSONFile(requests);
