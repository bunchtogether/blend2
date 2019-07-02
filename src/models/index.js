// @flow

const { getDevice, initDevice } = require('./device');
const logger = require('../lib/logger')('Models');

const initModels = async (db:Object) => {
  logger.info('Initializing models');
  await initDevice(db);
};

module.exports = {
  initModels,
  getDevice,
};
