import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  _id: String,
  name: String,
  username: { type: String, unique: true },
  password: String,
  email: { type: String, unique: true },
});

const User = model('users', UserSchema);
export default User;
