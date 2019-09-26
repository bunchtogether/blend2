//      

const os = require('os');
const fs = require('fs-extra');
const exec = require('child_process').exec;

const logger = require('./logger')('Updater');

const { BAND_UPDATE_CHECK } = process.env;


const triggerWindowsUpdate = async () => {
  throw new Error('Trigger Windows update not implemented yet');
};

const triggerLinuxUpdate = async () => {
  if (!BAND_UPDATE_CHECK) {
    throw new Error('Missing BAND_UPDATE_CHECK environmental variable, Update check script path is not defined');
  }

  const scriptExists = await fs.exists(BAND_UPDATE_CHECK);
  if (!scriptExists) {
    throw new Error(`Update script does not exist at ${BAND_UPDATE_CHECK}`);
  }
  await new Promise((resolve, reject) => {
    try {
      exec(`/bin/bash ${BAND_UPDATE_CHECK} -i`, { env: { 'PATH': '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' } }, (err, stdout, stderr) => { // eslint-disable-line
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
