import { login, authorizeTFA } from '../modules';

const loginResolvers = {
  Mutation: {
    login: (_, args) => login(args.email, args.password, args.remember),
    authorizeTFA: (_, { token, backupCode }, { user }) => authorizeTFA(user, backupCode, token),
  },
};

export default loginResolvers;
