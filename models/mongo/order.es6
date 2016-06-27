import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  producer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producer',
    required: true
  },
  price: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);
