/* created by: Andrew Poovey 06-22-16
    Schema for times that a restaurant is open
 */

import mongoose from 'mongoose';

const hourSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    validate: {
      validator: day => day === 'Monday' || day === 'Tuesday'
      || day === 'Wednesday' || day === 'Thursday' ||
      day === 'Friday' || day === 'Saturday' ||
      day === 'Sunday'
    }
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
// map for days of the week and map to true or false
export default mongoose.model('hours', hourSchema);
// HH:mm
