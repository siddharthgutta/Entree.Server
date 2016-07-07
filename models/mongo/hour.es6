/* created by: Andrew Poovey 06-22-16
    Schema for times that a restaurant is open
 */
import Moment from 'moment';
import mongoose from 'mongoose';
const hourSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  openTime: {
    type: String,
    required: true,
    validate: /^((([2][0-3])|([0-1][0-9])):[0-5][0-9])|([2][4]:[0][0])$/
  },
  closeTime: {
    type: String,
    required: true,
    validate: /^((([2][0-3])|([0-1][0-9])):[0-5][0-9])|([2][4]:[0][0])$/
  }
});
hourSchema.pre('validate', function (next) {
  const open = new Moment(this.openTime, 'HH:mm');
  const close = new Moment(this.closeTime, 'HH:mm');
  if (open.isAfter(close)) {
    next(Error('End Time must be greater than Start Time'));
  } else {
    next();
  }
});
export default mongoose.model('Hour', hourSchema);
