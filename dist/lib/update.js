//      
const logger = require('./logger')('Updater');
const os = require('os');

const exec = require('child_process').exec;


const triggerWindowsUpdate = async () => {
  throw new Error('Trigger Windows update not implemented yet');
  // await new Promise((resolve, reject) => {
  //   try {
  //     exec('/bin/bash /etc/band/scripts/update-check-windows', (err, stdout, stderr) => { // eslint-disable-line
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
};

const triggerLinuxUpdate = async () => {
  await new Promise((resolve, reject) => {
    try {
      exec('/bin/bash /etc/band/scripts/update-check', (err, stdout, stderr) => { // eslint-disable-line
        if (err) {
          reject(err);
        }
        if (stdout) {
          resolve(stdout);
        }
        if (stderr) {
          reject(stderr);
        }
      });
    } catch (error) {
      logger.errorStack(error);
      reject(error);
    }
  });
};

const triggerUpdate = async ()               => {
  logger.error('Triggering update');
  if (os.platform() === 'linux') {
    triggerLinuxUpdate();
  }
  if (os.platform() === 'win32') {
    triggerWindowsUpdate();
  }
};

module.exports = {
  triggerUpdate,
};
