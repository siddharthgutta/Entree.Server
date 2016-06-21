import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fbId: {
    type: String,
    required: true
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

export default mongoose.model('User', userSchema);
