/* created by: Andrew Poovey 06-22-16
    Schema for times that a restaurant is open
 */

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
export default mongoose.model('hours', hourSchema);
