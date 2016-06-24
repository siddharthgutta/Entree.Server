import mongoose from 'mongoose';

const producerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: num => num.length === 10
    }
  },
  profileImage: {
    type: String
  },
  enabled: {
    type: Boolean,
    default: false
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant'
  }
});

export default mongoose.model('Producer', producerSchema);
