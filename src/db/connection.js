import { connect, connection } from 'mongoose';

export default (dbURL, options = {}) => {
  connect(dbURL, options);
  connection.on('error', console.error.bind(console, 'MongoDB Connection Error'));
  connection.once('open', (callback) => {
    console.log('Connection Succeeded');
  });
  return connection;
};
