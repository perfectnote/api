import { UserInputError } from 'apollo-server-express';
import { hash as hashPassword } from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
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
  let user = await User.create({
    _id: new mongo.ObjectId(),
    name: args.name,
    email: args.email,
    password,
    username,
  });

  let token = jsonwebtoken.sign(
    { id: user._id, name: user.name, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '1y' }
  );

  return { token, user };
};

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
