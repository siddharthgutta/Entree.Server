import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  profileImage: {
    type: String
  },
  fbId: {
    type: String
  },
  venmoId: {
    type: String
  }
});

export default mongoose.model('User', userSchema);
