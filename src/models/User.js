import { Schema, model } from 'mongoose';

const BackupCodeSchema = new Schema({
  code: String,
  used: Boolean,
});

const UserSchema = new Schema({
  _id: String,
  name: String,
  username: { type: String, unique: true },
  password: String,
  email: { type: String, unique: true },
  tfa: String,
  backupCodes: [BackupCodeSchema],
});

const User = model('users', UserSchema);
export default User;
