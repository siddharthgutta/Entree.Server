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
  const prodHours = Hour.hourDict(hours);
  _.forIn(prodHours, hoursArray => {
    for (let k = 0; k < hoursArray.length - 1; k++) {
      const firstOpen = moment(hoursArray[k].openTime, 'HH:mm');
      const firstClose = moment(hoursArray[k].closeTime, 'HH:mm');
      const second = moment(hoursArray[k + 1].openTime, 'HH:mm');
      if (second.isSame(firstOpen) || (second.isAfter(firstOpen) && second.isBefore(firstClose))) {
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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    type: String
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
  },
  context: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Context',
    required: true
  },
  fbId: {
    type: String,
    unique: true,
    sparse: true
  },
  orderLink: {
    type: String
  },
  menuImage: {
    type: String
  }
}, {
  timestamps: true
});
export default mongoose.model('Producer', producerSchema);
