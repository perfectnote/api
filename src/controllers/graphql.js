import { ApolloServer } from 'apollo-server-express';
import { importSchema } from 'graphql-import';
import path from 'path';
import {
  Login,
  Signup,
  generateSecret,
  enableTFA,
  disableTFA,
  getBackupCodes,
  authorizeTFA,
} from '../resolvers';

const typeDefs = importSchema(path.join(__dirname, '..', 'graphql', 'schema.graphql'));

const resolvers = {
  Query: {
    generateSecret,
    getBackupCodes,
  },
  Mutation: {
    signup: Signup,
    login: Login,
    authorizeTFA,
    enableTFA,
    disableTFA,
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    user: req.user,
  }),
});

export default (app) => server.applyMiddleware({ app });
