import mongoose from 'mongoose';
import location from './location.es6';

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
    sparse: true,
    validate: {
      validator: id => id.length > 0 && id.length <= 36,
      message: 'Customer Id must be less than 37 characters and non-empty.'
    }
  },
  receiptCount: {
    type: Number,
    default: 1,
    validate: {
      validator: count => Number.isInteger(count),
      message: 'Receipt Count must be an integer'
    }
  },
  context: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Context',
    required: true
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  location: [location.schema],
  defaultLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  }
});

export default mongoose.model('Consumer', consumerSchema);
