/**
 * Created by kfu on 6/22/16.
 */

import mongoose from 'mongoose';

// TODO Implement enum for lastAction/state
const contextSchema = new mongoose.Schema({
  lastAction: {
    type: String
  },
  producer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producer'
  }
}, {
  timestamps: true
});

export default mongoose.model('Context', contextSchema);
