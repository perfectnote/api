import API from './API.js';
const api = new API({ port: process.env.PORT });

api.start();