import mongoose from 'mongoose';

const merchantSchema = new mongoose.Schema({
  merchantId: {
    type: String,
    validate: {
      validator: id => id.length > 0 && id.legnth <= 32
    }
  },
  merchantApproved: {
    type: Boolean
  },
  percentageFee: {
    type: Number,
    min: 0,
    max: 100
  },
  transactionFee: {
    type: Number,
    min: 0
  }
});

export default mongoose.model('Merchant', merchantSchema);
