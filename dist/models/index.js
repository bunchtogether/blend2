//      

const { initDevice } = require('./device');
const logger = require('../lib/logger')('Models');

const initModels = async (db       ) => {
  logger.info('Initializing models');
  const Device = await initDevice(db);
  logger.info(`Syncing ${db.getDialect()} database.`);
  await db.sync();
  return { Device };
};

module.exports = {
  initModels,
};
