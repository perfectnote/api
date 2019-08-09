import prepare from 'mocha-prepare';
import { start } from 'mongo-unit';
import dotenv from 'dotenv';
import connect from '../src/utils/db/connection';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

dotenv.config();

prepare((done) => {
  chai.use(chaiAsPromised);
  process.env.JWT_SECRET = 'test_token';
  start().then((testMongoUrl) => {
    process.env.DB_URL = testMongoUrl;
    console.log('Connecting to mocked database...');
    connect(
      process.env.DB_URL,
      { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false },
      done
    );
  });
});
