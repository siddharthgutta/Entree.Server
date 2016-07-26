import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    sparse: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String
  }
});

export default mongoose.model('User', userSchema);
