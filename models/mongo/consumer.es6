import mongoose from 'mongoose';

const consumerSchema = new mongoose.Schema({
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  fbId: {
    type: String,
    unique: true
  },
  customerId: {
    type: String,
    unique: true,
    validate: {
      validator: id => id.length > 0 && id.length <= 36
    }
  },
  receiptCount: {
    type: Number,
    default: 1
  }
});

export default mongoose.model('Consumer', consumerSchema);
