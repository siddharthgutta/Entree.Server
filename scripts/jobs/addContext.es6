import * as Producer from '../../api/controllers/producer.es6';
import * as Context from '../../api/controllers/context.es6';
import * as Utils from '../../libs/utils.es6';
import Promise from 'bluebird';
import _ from 'lodash';

/**
 * Adds context to a specific producer
 * @param {Producer} producer: producer to add context to
 * @param {Context} context: context to be added
 * @returns {{String: Boolean}}: key value pair with key as the producer's name and value as
 *  whether the adding succeeded
 */
async function addContext(producer, context) {
  const returnObj = {};
  try {
    await Producer.updateByObjectId(producer._id, {context: context._id});
    returnObj[producer.name] = true;
  } catch (err) {
    console.log(`Failed to add context for ${producer.name}\n${err}`);
    returnObj[producer.name] = false;
  }
  return returnObj;
}

/**
 * Adds contexts to producers that don't have contexts
 * @returns {Null} Unused
 */
async function addContextsIfDNE() {
  let added = 0;
  let alreadyExists = 0;
  let failedToAdd = 0;

  const producers = await Producer.findAll();
  const total = producers.length;
  const contextPromises = [];
  for (let index = 0; index < producers.length; index++) {
    const producer = producers[index];
    // If context is empty/does not exist, then add a context
    if (Utils.isEmpty(producer.context)) {
      console.log(`Creating context for ${producer.name}...`);
      const context = await Context.create();
      contextPromises.push(addContext(producer, context));
    } else {
      console.log(`Context Already Exists for ${producer.name}... moving on`);
      alreadyExists++;
    }
  }

  // Waits for all promises to execute
  const addContextResults = await Promise.all(contextPromises);

  console.log(`Add Context Results`);
  console.log(`-------------------`);
  _.forEach(addContextResults, addContextResult => {
    for (const producerName in addContextResult) { // eslint-disable-line
      const statusString = addContextResult[producerName] ? 'SUCCESS' : 'FAILED';
      if (addContextResult[producerName]) {
        added++;
      } else {
        failedToAdd++;
      }
      console.log(`${producerName}: ${statusString}`);
    }
  });

  console.log(`Total Producers: ${total}`);
  console.log(`Total Contexts Added: ${added}`);
  console.log(`Total Contexts Failed: ${failedToAdd}`);
  console.log(`Total Existing Contexts: ${alreadyExists}`);
}

addContextsIfDNE();
