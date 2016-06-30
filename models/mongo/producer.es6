import mongoose from 'mongoose';

const producerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
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
      validator: num => /^([0-9]{10})$/.test(num),
      message: 'Phone number must be 10 digits'
    }
  },
  profileImage: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: false,
    required: true
  },
  exampleOrder: {
    type: String,
    required: true
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant'
  },
  menuLink: {
    type: String
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }]
}, {
  timestamps: true
});

export default mongoose.model('Producer', producerSchema);
