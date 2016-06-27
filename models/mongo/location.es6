import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      validate: {
        validator: lat => lat > -90 && lat < 90,
        message: 'invalid latitude'
      }
    },
    longitude: {
      type: Number,
      required: true,
      validate: {
        validator: long => long > -180 && long < 180,
        message: 'invalid longitude'
      }
    }
  },
  address: {
    type: String
  }
});

export default mongoose.model('Location', locationSchema);
