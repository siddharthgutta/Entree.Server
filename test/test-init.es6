/**
 * Created by jadesym on 6/20/16.
 */
import {close} from '../models/mongo/index.es6';

// Setup for testing environment
before(() => {
  console.log('Before Tests Run');
});

// Teardown for testing environment
after(async () => {
  await close();
  console.log('\nAfter Tests Run');
});
