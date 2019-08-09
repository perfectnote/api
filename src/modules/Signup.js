import { UserInputError } from 'apollo-server-express';
import { hash as hashPassword } from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import { mongo } from 'mongoose';
import { User } from '../models';

export const signup = async (email, password, name) => {
  if (!isEmailValid(email)) throw new UserInputError('Invalid email');

  email = email.toLowerCase();

  const hashedPassword = await hashPassword(password, 10);

  const username = `${email.split('@')[0].replace(/\W/g, '-')}-${Date.now()
    .toString(16)
    .slice(-6)}`;

  if ((await User.find({ $or: [{ email: email }, { username: username }] })).length !== 0)
    throw new UserInputError('Duplicate email');

  const user = await User.create({
    _id: new mongo.ObjectId(),
    name: name,
    email: email,
    password: hashedPassword,
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
