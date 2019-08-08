import { signup } from '../modules';

const signupResolvers = {
  Mutation: {
    signup: (_, args) => signup(args.email, args.password, args.name),
  },
};

export default signupResolvers;
