import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  password: String,
  role: { type: String, enum: ["resident", "admin", "president"], default: "resident" }
});

export default mongoose.model('User', userSchema);
