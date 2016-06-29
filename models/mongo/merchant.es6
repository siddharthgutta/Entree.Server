import mongoose from 'mongoose';

const merchantSchema = new mongoose.Schema({
  merchantId: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: id => id.length > 0 && id.length <= 32,
      message: 'Merchant id must be between 1 and 32 characters'
    }
  },
  approved: {
    type: Boolean,
    required: true,
    default: false
  },
  percentageFee: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  transactionFee: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: transactionFee => Number.isInteger(transactionFee),
      message: 'Transaction Fee is not an integer'
    }
  }
});

export default mongoose.model('Merchant', merchantSchema);
