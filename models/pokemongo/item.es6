import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: {
    type: String
  },
  types: [String],
  combatPower: {
    type: Number
  },
  offer: {
    type: String,
    enum: ['buy', 'sell', 'trade']
  },
  status: {
    type: String,
    enum: ['pending', 'sold', 'onHold']
  },
  price: {
    type: Number
  },
  description: {
    type: String
  },
  photos: [String],
  defaultPhoto: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Item', itemSchema);
