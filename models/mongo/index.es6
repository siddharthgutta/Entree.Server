import fs from 'fs';
import path from 'path';
import config from 'config';
import mongoose from 'mongoose';
import Promise from 'bluebird';

const mongoConfig = config.get('MongoDb');
mongoose.Promise = Promise;
mongoose.connect(`mongodb://${mongoConfig.host}:${mongoConfig.port}/${mongoConfig.database}`);

const basename = path.basename(module.filename);
const db = Object.create(null);

/* This makes all of the mongodb models available through this single file by exporting all of
 * the individual models. We're importing each <model>.es6 file manually by scanning the directory
 * and then re-exporting the model*/

fs.readdirSync(__dirname)
  .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file)).default;
    db[model.modelName] = model;
    exports[model.modelName] = model;
  });

db.mongoose = mongoose;

export default db;