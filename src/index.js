import API from './API.js';
import dotenv from 'dotenv';

dotenv.config();

const api = new API({ port: process.env.PORT });

api.start();
