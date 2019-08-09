import { AuthenticationError, UserInputError } from 'apollo-server-express';
import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import { User } from '../models';
import { isLoggedIn } from '../utils/auth';

export const generateSecret = async (payload) => {
  if (!(await isLoggedIn(payload))) throw new AuthenticationError('Must be logged in');

  const secret = speakeasy.generateSecret({ name: `${payload.name}:PerfectNote` });
  const qrcode = await QRCode.toDataURL(secret.otpauth_url);

  return { secret: secret.base32, qrcode };
};

export const enableTFA = async (payload, secret, token) => {
  var user = await isLoggedIn(payload, 'tfa');
  if (!user) throw new AuthenticationError('Must be logged in');

  if (!!user.tfa) throw new UserInputError('User already has TFA enabled');

  const verified = speakeasy.totp.verify({
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

  if (!user.tfa) throw new UserInputError('TFA is not enabled');

  const verified = speakeasy.totp.verify({
    secret: user.tfa,
    encoding: 'base32',
    token,
    window: 2,
  });
  if (!verified) throw new UserInputError('Invalid token');

  await User.updateOne({ _id: payload.id }, { tfa: undefined, backupCodes: undefined });

  return payload.id;
};

export const getBackupCodes = async (payload) => {
  var user = await isLoggedIn(payload, 'backupCodes');
  if (!user) throw new AuthenticationError('Must be logged in');

  if (!user.backupCodes) throw new UserInputError('TFA is not enabled');

  return user.backupCodes;
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
