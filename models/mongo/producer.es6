import mongoose from 'mongoose';
import hour from './hour.es6';
import Moment from 'moment';
import _ from 'lodash';
import * as Hour from '../../api/controllers/hour.es6';
import * as Util from '../../libs/utils.es6';

function hourDict(hours) {
  const innerObj = {};
  _.forEach(hours, time => {
    if (Util.isEmpty(innerObj[time.day])) {
      innerObj[time.day] = [];
    }
    innerObj[time.day].push(time);
  });
  return innerObj;
}

/**
<<<<<<< 60855c8a4da629acbaae62b7110a3bd15aa9fd10
 * Sorts the hours in buckets then sorts the buckets using the hourComp function
 *  then checks to see if the times overlap
 * @param {Array} hours: the producers hours to check with
=======
 * Converts the time in the Producer schema to a number
 * @param {String} time:  the 'HH:mm' formatted string to cast to an integer
 * @returns {number} the time in integer form
 */
function convertHour(time) {
  return Number(new Moment(time, 'HH:mm').format('HHmm'));
}

/**
 * Compares the hour objects in the Schema, used in the sort method
 * @param {moment} first: the first object to compare to by openTime then closeTime
 * @param {moment} second: the second object to compare to by openTime then closeTime
 * @returns {number}: returns 1 if the first is greater, -1 if the second is greater, 0  if equal
 */
function hourComp(first, second) {
  let firstNum = convertHour(first.openTime);
  let secondNum = convertHour(second.openTime);
  if (firstNum - secondNum > 0) return 1;
  else if (firstNum - secondNum < 0) return -1;
  else if (firstNum === secondNum) {
    firstNum = convertHour(first.closeTime);
    secondNum = convertHour(second.closeTime);
    if (firstNum - secondNum > 0) return 1;
    if (firstNum - secondNum < 0) return -1;
    return 0;
  }
}

/**
 * Sorts the hours in buckets then sorts the buckets using the hourComp function
 *  then checks to see if the times overlap
 * @param {hour} hours: the producers hours to check with
>>>>>>> added validation and find open methods
 * @returns {boolean}: returns if there is a conflict or not to the validator
 */
function hourCheck(hours) {
  let ret = true;
  const daysHours = hourDict(hours);
  _.forIn(daysHours, value => {
    const valArr = value.sort(Hour.hourComp);
    for (let k = 0; k < valArr.length - 1; k++) {
      const firstOpen = new Moment((valArr[k].openTime), 'HH:mm');
      const firstClose = new Moment((valArr[k].closeTime), 'HH:mm');
      const second = new Moment((valArr[k + 1].openTime), 'HH:mm');
      if (second.isAfter(firstOpen) && second.isBefore(firstClose)) {
  const hourKV = hourDict(hours);
  _.forIn(hourKV, value => {
    const valArr = value.sort(hourComp);
    for (let k = 0; k < valArr.length - 1; k++) {
      const firstOpen = convertHour(valArr[k].openTime);
      const firstClose = convertHour(valArr[k].closeTime);
      const second = convertHour(valArr[k + 1].openTime);
      if (second > firstOpen && second < firstClose) {
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
},
{
  timestamps: true
});

export default mongoose.model('Producer', producerSchema);
