import mongoose from 'mongoose';
import {OrderStatuses} from '../constants/order-status.es6';

const orderSchema = new mongoose.Schema({
  body: {
    type: String,
    required: true
  },
  producer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producer',
    required: true
  },
  consumer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consumer',
    required: true
  },
  status: {
    type: String,
    enum: OrderStatuses,
    default: 'Pending'
  },
  price: {
    type: Number,
    validate: {
      validator: price => Number.isInteger(price) && price > 0,
      message: 'Price must be an integer greater than 0'
    }
  },
  eta: {
    type: Number,
    validate: {
      validator: eta => Number.isInteger(eta) && eta > 0,
      message: 'eta must be an integer greater than 0'
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);
