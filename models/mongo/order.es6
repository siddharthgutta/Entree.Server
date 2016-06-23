import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  text: {
    type: String
  },
  producer: {
    type: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);
