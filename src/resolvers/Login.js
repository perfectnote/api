import { UserInputError } from 'apollo-server-express';
import { compare as comparePassword } from 'bcrypt';
import { User } from '../models';

export default async (_, args) => {
  let response = await User.findOne({ email: args.email }, 'name email username password');
  if (!response) throw new UserInputError('Wrong email');

  const match = await comparePassword(args.password, response.password);
  if (!match) throw new UserInputError('Wrong password');

  return { token: 'test', user: response };
};
