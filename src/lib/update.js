// @flow
const logger = require('./logger')('Updater');

// const exec = require('child_process').exec;

// await new Promise((resolve, reject) => {
//   try {
//     exec('/bin/sh /home/ubuntu/script.sh', (err, stdout, stderr) => { // eslint-disable-line
//       if (err) {
//         reject(err);
//       }
//       if (stdout) {
//         resolve(stdout);
//       }
//       if (stderr) {
//         reject(stderr);
//       }
//     });
//   } catch (error) {
//     logger.errorStack(error);
//     reject(error);
//   }
// });

const triggerUpdate = async ():Promise<void> => {
  logger.error('Triggering update');
  throw new Error('triggerUpdate not implemented yet');
};

module.exports = {
  triggerUpdate,
};
