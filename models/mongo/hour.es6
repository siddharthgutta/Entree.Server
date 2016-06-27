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
    validate: {
      validator: day => day === 'Monday' || day === 'Tuesday'
      || day === 'Wednesday' || day === 'Thursday' ||
      day === 'Friday' || day === 'Saturday' ||
      day === 'Sunday'
    }
>>>>>>> added hours to the producers and functions to access and change them
  },
  openTime: {
    type: String,
    required: true,
    validate: /^(([2][0-4])|([0-1][0-9])):[0-5][0-9]$/
  },
  closeTime: {
    type: String,
    required: true,
    validate: /^(([2][0-4])|([0-1][0-9])):[0-5][0-9]$/
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
export default mongoose.model('hours', hourSchema);
