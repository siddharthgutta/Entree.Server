import mongoose from 'mongoose';
import context from './context.es6';
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
  },
  context: context, // eslint-disable-line
  orders: order
});

export default mongoose.model('Consumer', consumerSchema);
