import { disableTFA, enableTFA, generateSecret, getBackupCodes } from '../modules';

const tfaResolvers = {
  Query: {
    generateSecret: (_, _args, { user }) => generateSecret(user),
    getBackupCodes: (_, _args, { user }) => getBackupCodes(user),
  },
  Mutation: {
    enableTFA: (_, { secret, token }, { user }) => enableTFA(user, secret, token),
    disableTFA: (_, { token }, { user }) => disableTFA(user, token),
  },
};

export default tfaResolvers;
