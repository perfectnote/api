import dotenv from 'dotenv';

import express from 'express';
import apiSetup from './api/v1/api';

import bodyParser from 'body-parser';
import tokenBearer from 'express-bearer-token';

dotenv.config();
const app = express();

export class Wrapper {
  constructor(options = {}) {
    this.options = options;
  }

  start(port = this.options.port || process.env.PORT || 5000) {
    app.disable('x-powered-by');
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(tokenBearer());

    // Setup API
    app.use('/api/v1', apiSetup(express.Router()));

    app.listen(port, () => {
      this.log(`Listening on port ${port}`, 'API');
    });
  }

  log(...args) {
    const message = args[0];
    const tags = args.slice(1).map((tag) => `[${tag}]`);
    console.log(...tags, message);
  }

  logError(...args) {
    const tags = args.length > 1 
      ? args.slice(0, -1).map((tags) => `[${tags}]`) 
      : [];
    console.error('[Error]', ...tags, args[args.length - 1]);
  }
};