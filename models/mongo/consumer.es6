import mongoose from 'mongoose';
import order from './order.es6';

const consumerSchema = new mongoose.Schema({
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  fbId: {
    type: String,
    unique: true,
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
  },
  context: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Context'
  },
  orders: [order]  // eslint-disable-line
});

export default mongoose.model('Consumer', consumerSchema);
