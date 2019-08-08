import { generateSecret, enableTFA, disableTFA, getBackupCodes, authorizeTFA } from '../modules';

const tfaResolvers = {
  Query: {
    generateSecret: (_, _args, { user }) => generateSecret(user),
    getBackupCodes: (_, _args, { user }) => getBackupCodes(user),
  },
  Mutation: {
    authorizeTFA: (_, { token, backupCode }, { user }) => authorizeTFA(user, backupCode, token),
    enableTFA: (_, { secret, token }, { user }) => enableTFA(user, secret, token),
    disableTFA: (_, { token }, { user }) => disableTFA(user, token),
  },
};

export default tfaResolvers;
