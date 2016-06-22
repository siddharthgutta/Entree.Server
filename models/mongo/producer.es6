import mongoose from 'mongoose';
import merchant from './merchant.es6';

const producerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: num => num.length === 10
    }
  },
  profileImage: {
    type: String
  },
  enabled: {
    type: Boolean
  },
  merchant: [merchant] // eslint-disable-line
});

export default mongoose.model('Producer', producerSchema);
