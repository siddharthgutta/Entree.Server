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
      validator: id => id.length > 0 && id.legnth <= 36
    }
  },
  receiptCount: {
    type: Number,
    required: true,
    default: 1
  }
});

export default mongoose.model('User', userSchema);
