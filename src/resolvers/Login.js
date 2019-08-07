import { UserInputError } from 'apollo-server-express';
import { compare as comparePassword } from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import { User } from '../models';

export default async (_, args) => {
  const user = await User.findOne({ email: args.email }, 'name email username password tfa');
  if (!user) throw new UserInputError('Wrong email');

  const match = await comparePassword(args.password, user.password);
  if (!match) throw new UserInputError('Wrong password');

  var token;
  if (!!user.tfa) {
    token = jsonwebtoken.sign(
      { id: user._id, requiresTFA: true, remember: args.remember },
      process.env.JWT_SECRET,
      {
        expiresIn: '30m',
      }
    );
  } else {
    token = jsonwebtoken.sign(
      { id: user._id, name: user.name, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: args.remember ? '1y' : '1d' }
    );
  }

  return { token, user };
};
