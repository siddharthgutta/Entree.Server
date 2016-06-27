import mongoose from 'mongoose';
import order from './order.es6';

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
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant'
  },
  menuLink: {
    type: String
  },
  orders: [order.schema]
});

export default mongoose.model('Producer', producerSchema);
