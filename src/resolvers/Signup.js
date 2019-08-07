import { UserInputError } from 'apollo-server-express';
import { hash as hashPassword } from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import { mongo } from 'mongoose';
import { User } from '../models';

export default async (_, args) => {
  if (!isEmailValid(args.email)) throw new UserInputError('Invalid email');

  const password = await hashPassword(args.password, 10);

  const username = `${args.email.split('@')[0].replace(/\W/g, '-')}-${Date.now()
    .toString(16)
    .slice(-6)}`;

  const user = await User.create({
    _id: new mongo.ObjectId(),
    name: args.name,
    email: args.email,
    password,
    username,
  });

  const token = jsonwebtoken.sign(
    { id: user._id, name: user.name, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '1y' }
  );

  return { token, user };
};

const isEmailValid = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
