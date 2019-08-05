import express from 'express';

import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import tokenBearer from 'express-bearer-token';
import helmet from 'helmet';
import morgan from 'morgan';

import connect from './utils/db/connection.js';
import globalRoute from './controllers/index.js';
import testRoute from './controllers/test.js';
import log from './utils/logger/index.js';

import dotenv from 'dotenv';
dotenv.config();

const app = express();
const db = connect(process.env.DB_URL, { useNewUrlParser: true });

export default class Wrapper {
  constructor(options = {}) {
    this.options = options;
    this.log = log;
  }

  start(port = this.options.port || process.env.PORT || 5000) {
    app.enable('trust proxy', true);

    app.use(morgan('combined'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(helmet());
    app.use(compression());
    app.use(cors());
    app.use(tokenBearer());
    app.use(rateLimit({
      windowMs: 10000,
      max: 50,
      headers: true,
      handler: (req, res) => {
        res.status(429).json({ code: 429, message: 'Too many requests' });
      }
    }));   

    app.use('/test', testRoute);
    app.use(globalRoute);

    app.listen(port, () => {
      this.log(`Listening on port ${port}`, 'API');
    });
  }
};