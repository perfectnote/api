import { generateSecret as generateTFASecret, totp } from 'speakeasy';
import { AuthenticationError, UserInputError } from 'apollo-server-core';
import QRCode from 'qrcode';
import { User } from '../models';
import jsonwebtoken from 'jsonwebtoken';

export const generateSecret = async (_, _args, { user }) => {
  if (!user) new AuthenticationError('Must be logged in');

  const secret = generateTFASecret({ name: 'PerfectNote' });
  const qrcode = await QRCode.toDataURL(secret.otpauth_url);

  return { secret: secret.base32, qrcode };
};

export const enableTFA = async (_, {secret, token}, { user }) => {
  if (!user) throw new AuthenticationError('Must be logged in');

  const verified = totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });
  if (!verified) throw new UserInputError('Invalid token');

  const backupCodes = generateBackupCodes();

  await User.updateOne({ _id: user.id }, { tfa: secret, backupCodes });

  return backupCodes;
};

export const disableTFA = async (_, {token}, { user }) => {
  if (!user) throw new AuthenticationError('Must be logged in');

  const { tfa } = await User.findById(user.id, 'tfa');

  const verified = totp.verify({ secret: tfa, encoding: 'base32', token, window: 2 });
  if (!verified) throw new UserInputError('Invalid token');

  await User.updateOne({ _id: user.id }, { tfa: undefined, backupCodes: undefined });

  return user.id;
};

export const getBackupCodes = async (_, _args, { user }) => {
  if (!user) throw new AuthenticationError('Must be logged in');

  const { backupCodes } = await User.findById(user.id, 'backupCodes');

  return backupCodes;
};

export const authorizeTFA = async (_, {backupCode, token}, { user }) => {
  if (!user) throw new AuthenticationError('Must have gone through the first factor auth');
  if (!user.requiresTFA) throw new UserInputError('User does not need to authorize TFA');

  if (backupCode) {
    // TODO maybe it's possible to do everything in one query?
    let { backupCodes, name, username } = await User.findById(user.id, 'backupCodes name username');
    const codeIndex = backupCodes.findIndex((code) => code.code === token && !code.used);
    if (codeIndex === -1) throw new AuthenticationError('Invalid backup code');
    backupCodes[codeIndex].used = true;
    await User.updateOne({ _id: user.id }, { backupCodes });
  } else {
    const { tfa, name, username } = await User.findById(user.id, 'tfa name username');

    const verified = totp.verify({ secret: tfa, encoding: 'base32', token, window: 2 });
    if (!verified) throw new AuthenticationError('Invalid token');
  }
  return {
    token: jsonwebtoken.sign({ id: user.id, name, username }, process.env.JWT_SECRET, {
      expiresIn: user.remember ? '1y' : '1d',
    }),
  };
};

const generateBackupCodes = () => {
  const gen = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    backupCodes.push({ code: gen(8), used: false });
  }
  return backupCodes;
};
