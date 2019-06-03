import dotenv from 'dotenv';
import express from 'express';

import bodyParser from 'body-parser';
import tokenBearer from 'express-bearer-token';
import cors from 'cors';

import morgan from 'morgan';
import log from './utils/Logger.js';
import connect from './db/connection.js';

import apiRoute from './api/v1/api.js';

dotenv.config();
const app = express();
const db = connect(process.env.DB_URL, { useNewUrlParser: true });

export default class Wrapper {
  constructor(options = {}) {
    this.options = options;
    this.log = log;
  }

  start(port = this.options.port || process.env.PORT || 5000) {
    app.disable('x-powered-by');
    app.use(morgan('combined'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cors());
    app.use(tokenBearer());
  
    app.use('/api/v1', apiRoute(express.Router()));

    app.listen(port, () => {
      this.log(`Listening on port ${port}`, 'API');
    });
  }
};