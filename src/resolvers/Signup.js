import { UserInputError } from 'apollo-server-express';
import { hash as hashPassword } from 'bcrypt';
import { mongo } from 'mongoose';
import { User } from '../models';

export default async (_, args) => {
  if (!isEmailValid(args.email)) throw new UserInputError('Invalid email');

  var password = await hashPassword(args.password, 10);

  var username =
    args.email.split('@')[0].replace(/\W/g, '-') +
    '-' +
    Date.now()
      .toString(16)
      .slice(-6);

  var user = {
    _id: new mongo.ObjectId(),
    name: args.name,
    email: args.email,
    password,
    username,
  };

  let response = await User.create(user);

  return { token: 'test', user: response };
};

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
