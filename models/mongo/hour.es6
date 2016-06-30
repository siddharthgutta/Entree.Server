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
    validate: /^(([2][0-4])|([0-1][0-9])):[0-5][0-9]$/
  },
  closeTime: {
    type: String,
    required: true,
    validate: /^(([2][0-4])|([0-1][0-9])):[0-5][0-9]$/
  }
});
hourSchema.pre('validate', function (next) {
  if (this.openTime !== this.openTime || this.closeTime !== this.closeTime) next(Error('NaN'));
  const open = Number(new Moment(this.openTime, 'HH:mm').format('HHmm'));
  const close = Number(new Moment(this.closeTime, 'HH:mm').format('HHmm'));
  if (open > close) {
    next(Error('End Time must be greater than Start Time'));
  } else {
    next();
  }
});
export default mongoose.model('hours', hourSchema);
