import { login } from '../modules';

const loginResolvers = {
  Mutation: {
    login: (_, args) => login(args.email, args.password, args.remember),
  },
};

export default loginResolvers;
