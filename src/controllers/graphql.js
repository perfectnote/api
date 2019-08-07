import { ApolloServer } from 'apollo-server-express';
import { importSchema } from 'graphql-import';
import path from 'path';
import { Login, Signup } from '../resolvers';

const typeDefs = importSchema(path.join(__dirname, '..', 'graphql', 'schema.graphql'));

const resolvers = {
  Query: {
    helloworld: (_, _args, { user }) => user.username,
  },
  Mutation: {
    signup: Signup,
    login: Login,
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
