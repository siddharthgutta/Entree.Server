/**
 * Created by kfu on 6/26/16.
 */

import * as Producer from '../../api/controllers/producer.es6';
import Promise from 'bluebird';
import fs from 'fs';
import _ from 'lodash';

console.log(__filename);
console.log(__dirname);

function getJSONFromFile(fileWithoutExtension) {
  return new Promise((resolve, reject) => {
    fs.readFile(`./producers/${fileWithoutExtension}.json`, 'utf8', (err, data) => {
      console.log(`${fileWithoutExtension}:${data}`);
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  });
}

const requests = [];
const fileArray = [];

process.argv.map((val, index) => {
  if (index <= 1) return;
  fileArray.push(val);
  console.log(`${index}: ${val}`);
  requests.push(getJSONFromFile(val));
});

async function handleJSONFile(promises) {
  try {
    const results = await Promise.all(promises);
    _.forEach(results, async value => {
      const {name, username, password, description, profileImage, exampleOrder, address,
        percentageFee, transactionFee, menuLink, optional} = value;
      try {
        const {_id} = await Producer.findOneByUsername(username);
        console.log(`Found existing producer by username: |${username}|. Updating producer...`);
        await Producer.updateByObjectId(_id, {name, username, password, description, percentageFee, transactionFee,
          profileImage, exampleOrder, enabled: optional.producer.enabled, menuLink: optional.producer.menuLink});
      } catch (err) {
        console.log(`Could not find existing producer by username: ${username}. Creating new producer...`);
        await Producer.create(name, username, password, description, profileImage, exampleOrder, address,
          percentageFee, transactionFee, menuLink, optional);
      }
      const producer = await Producer.findOneByUsername(username);
      console.log(producer);
    });
    console.log(`Finished adding ${fileArray.length} producers: ${fileArray}`);
  } catch (err) {
    console.log(`Error adding producers: ${err}`);
  }
}

handleJSONFile(requests);
