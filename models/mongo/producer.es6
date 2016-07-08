import mongoose from 'mongoose';
import hour from './hour.es6';
import moment from 'moment';
import _ from 'lodash';
import * as Hour from '../../libs/hour.es6';


/**
 * Sorts the hours in buckets then sorts the buckets using the hourComp function
 *  then checks to see if the times overlap
 * @param {Array} hours: the producers hours to check with
 * @returns {boolean}: returns if there is a conflict or not to the validator
 */
function hourCheck(hours) {
  let ret = true;
  const hourKV = Hour.hourDict(hours);
  _.forIn(hourKV, valArr => {
    for (let k = 0; k < valArr.length - 1; k++) {
      const firstOpen = moment(valArr[k].openTime, 'HH:mm');
      const firstClose = moment(valArr[k].closeTime, 'HH:mm');
      const second = moment(valArr[k + 1].openTime, 'HH:mm');
      if (second.isSame(firstOpen) ||
      (second.isAfter(firstOpen) && second.isBefore(firstClose))) {
        ret = false;
        return false;
      }
    }
  });
  return ret;
}

const producerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: num => /^([0-9]{10})$/.test(num),
      message: 'Phone number must be 10 digits'
    }
  },
  profileImage: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: false,
    required: true
  },
  exampleOrder: {
    type: String,
    required: true
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  menuLink: {
    type: String,
    required: true
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  hours: {
    type: [hour.schema],
    validate: {
      validator: hours => hourCheck(hours)
    }
  }

}, {
  timestamps: true
});
export default mongoose.model('Producer', producerSchema);
