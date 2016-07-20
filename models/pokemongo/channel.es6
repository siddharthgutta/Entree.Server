import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  buyerFbId: {
    type: String
  },
  sellerFbId: {
    type: String
  },
  open: {
    type: Boolean
  }
}, {
  timestamps: true
});

export default mongoose.model('Channel', channelSchema);
