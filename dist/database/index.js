//      

const level = require('level');
const { LEVEL_DB_DEVICE } = require('../constants');
const logger = require('../lib/logger')('LevelDB');

module.exports = async (path       ) => {
  const instance = await new Promise((resolve, reject) => {
    level(path, { valueEncoding: 'json' }, (error, db) => {
      if (error) {
        if (error.stack) {
          logger.error('Error opening:');
          error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
        } else {
          logger.error(`Error opening: ${error.message}`);
        }
        reject(error);
      } else {
        resolve(db);
      }
    });
  });
  while (!instance.isOpen()) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  logger.info(`Open at ${path}`);
  try {
    await instance.get(LEVEL_DB_DEVICE);
  } catch (error) {
    if (!(error.notFound)) {
      logger.error('Error initializing lebel');
      logger.errorStack(error);
      throw error;
    }
    await instance.put(LEVEL_DB_DEVICE, {
      type: null,
      data: null,
    });
  }
  return [instance, async () => {
    try {
      await instance.close();
    } catch (error) {
      if (error.stack) {
        logger.error('Error closing:');
        error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
      } else {
        logger.error(`Error closing: ${error.message}`);
      }
      throw error;
    }
  }];
};
