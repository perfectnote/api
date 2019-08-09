import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { compare as comparePassword } from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { User } from '../models';

export const login = async (email, password, remember) => {
  email = email.toLowerCase();
  const user = await User.findOne({ email }, 'name email username password tfa');
  if (!user) throw new UserInputError('Wrong email');

  const match = await comparePassword(password, user.password);
  if (!match) throw new UserInputError('Wrong password');

  var token;
  if (!!user.tfa) {
    token = jsonwebtoken.sign(
      { id: user._id, requiresTFA: true, remember: remember },
      process.env.JWT_SECRET,
      {
        expiresIn: '30m',
      }
    );
  } else {
    token = jsonwebtoken.sign(
      { id: user._id, name: user.name, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: remember ? '1y' : '1d' }
    );
  }

  return { token, requiresTFA: !!user.tfa, user };
};

export const authorizeTFA = async (payload, backupCode, token) => {
  if (!payload) throw new AuthenticationError('Must have gone through the first factor auth');
  if (!payload.requiresTFA) throw new UserInputError('User does not need to authorize TFA');

  if (backupCode) {
    // TODO maybe it's possible to do everything in one query?
    var { backupCodes, name, username } = await User.findById(
      payload.id,
      'backupCodes name username'
    );
    const codeIndex = backupCodes.findIndex((code) => code.code === token && !code.used);
    if (codeIndex === -1) throw new AuthenticationError('Invalid backup code');
    backupCodes[codeIndex].used = true;
    await User.updateOne({ _id: payload.id }, { backupCodes });
  } else {
    var { tfa, name, username } = await User.findById(payload.id, 'tfa name username');

    const verified = speakeasy.totp.verify({ secret: tfa, encoding: 'base32', token, window: 2 });
    if (!verified) throw new AuthenticationError('Invalid token');
  }
  return {
    token: jsonwebtoken.sign({ id: payload.id, name, username }, process.env.JWT_SECRET, {
      expiresIn: payload.remember ? '1y' : '1d',
    }),
  };
};
