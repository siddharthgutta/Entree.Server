/**
 * Created by kfu on 6/22/16.
 */

import mongoose from 'mongoose';

const contextSchema = new mongoose.Schema({
  botVersion: {
    type: Number
  },
  lastAction: {
    type: String
  },
  producer: {
    type: mongoose.Schema.Types.ObjectId
  }
});

export default mongoose.model('Context', contextSchema);
