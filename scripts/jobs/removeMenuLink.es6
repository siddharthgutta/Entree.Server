import * as Producer from '../../api/controllers/producer.es6';
import * as Utils from '../../libs/utils.es6';
import Promise from 'bluebird';
import _ from 'lodash';

/**
 * Removes the menuLink for a specific producer
 * @param {Producer} producer: producer to remove menuLink from
 * @returns {{String: Boolean}}: key value pair with key as the producer's name and value as
 *  whether the adding succeeded
 */
async function removeMenuLink(producer) {
  const returnObj = {};
  try {
    await Producer.updateByObjectId(producer._id, {menuLink: undefined});
    returnObj[producer.name] = true;
  } catch (err) {
    console.log(`Failed to add remove menu link for ${producer.name}\n${err}`);
    returnObj[producer.name] = false;
  }
  return returnObj;
}

/**
 * Removes menuLink for Producers that have it
 * @returns {Null} Unused
 */
async function removeMenuLinkIfExists() {
  let removed = 0;
  let alreadyFixed = 0;
  let failedToRemove = 0;

  const producers = await Producer.findAll();
  const total = producers.length;
  const menuLinkPromises = [];
  for (let index = 0; index < producers.length; index++) {
    const producer = producers[index];
    // If menuLink is defined remove it
    if (!Utils.isEmpty(producer.menuLink)) { // if they are there then remove them
      console.log(`Deleting menuLink for ${producer.name}...`);
      menuLinkPromises.push(removeMenuLink(producer));
    } else {
      console.log(`No menuLink Exists for ${producer.name}... moving on`);
      alreadyFixed++;
    }
  }

  // Waits for all promises to execute
  const removeMenuLinkResults = await Promise.all(menuLinkPromises);

  console.log(`Add MenuLink Results`);
  console.log(`-------------------`);
  _.forEach(removeMenuLinkResults, removeMenuLinkResult => {
    for (const producerName in removeMenuLinkResult) { // eslint-disable-line
      const statusString = removeMenuLinkResult[producerName] ? 'SUCCESS' : 'FAILED';
      if (removeMenuLinkResult[producerName]) {
        removed++;
      } else {
        failedToRemove++;
      }
      console.log(`${producerName}: ${statusString}`);
    }
  });

  console.log(`Total Producers: ${total}`);
  console.log(`Total MenuLinks Removed: ${removed}`);
  console.log(`Total MenuLinks Failed: ${failedToRemove}`);
  console.log(`Total Producers without MenuLinks: ${alreadyFixed}`);
}

removeMenuLinkIfExists();
