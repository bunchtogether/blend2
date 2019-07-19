// @flow

const fs = require('fs');
const logger = require('./logger')('Utilities');

module.exports.checkFileExists = async function (filePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, fileStats) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve(false);
        }
        logger.error(`Error occured while checking if ${filePath} exists`);
        return reject(err);
      }
      return resolve(fileStats.isFile());
    });
  });
};
