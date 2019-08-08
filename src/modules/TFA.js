import { generateSecret as generateTFASecret, totp } from 'speakeasy';
import { AuthenticationError, UserInputError } from 'apollo-server-core';
import QRCode from 'qrcode';
import { User } from '../models';
import jsonwebtoken from 'jsonwebtoken';
import { isLoggedIn } from '../utils/auth';

export const generateSecret = async (payload) => {
  if (!(await isLoggedIn(payload))) new AuthenticationError('Must be logged in');

  const secret = generateTFASecret({ name: 'PerfectNote' });
  const qrcode = await QRCode.toDataURL(secret.otpauth_url);

  return { secret: secret.base32, qrcode };
};

export const enableTFA = async (payload, secret, token) => {
  if (!(await isLoggedIn(payload))) throw new AuthenticationError('Must be logged in');

  const verified = totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });
  if (!verified) throw new UserInputError('Invalid token');

  const backupCodes = generateBackupCodes();

  await User.updateOne({ _id: payload.id }, { tfa: secret, backupCodes });

  return backupCodes;
};

export const disableTFA = async (payload, token) => {
  var user = await isLoggedIn(payload, 'tfa');
  if (!user) throw new AuthenticationError('Must be logged in');

  const verified = totp.verify({ secret: user.tfa, encoding: 'base32', token, window: 2 });
  if (!verified) throw new UserInputError('Invalid token');

  await User.updateOne({ _id: payload.id }, { tfa: undefined, backupCodes: undefined });

  return payload.id;
};

export const getBackupCodes = async (payload) => {
  var user = await isLoggedIn(payload, 'backupCodes');
  if (!user) throw new AuthenticationError('Must be logged in');

  return user.backupCodes;
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

    const verified = totp.verify({ secret: tfa, encoding: 'base32', token, window: 2 });
    if (!verified) throw new AuthenticationError('Invalid token');
  }
  return {
    token: jsonwebtoken.sign({ id: payload.id, name, username }, process.env.JWT_SECRET, {
      expiresIn: payload.remember ? '1y' : '1d',
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
