//      

const Sequelize = require('sequelize');
const logger = require('../lib/logger')('Database');

const options = {
  pool: {
    max: 8,
    min: 0,
    acquire: 20000,
    idle: 20000,
  },
  logging: (message       ) => logger.debug(message),
};


async function _initDatabase(connection        ) { // eslint-disable-line no-underscore-dangle
  const db = new Sequelize(connection, options);
  // Create tables in database
  try {
    logger.info(`Establishing ${db.getDialect()} database connection.`);
    await db.authenticate();
    logger.info(`Syncing ${db.getDialect()} database.`);
    await db.sync();
  } catch (error) {
    logger.error(`Failed to initialize ${db.getDialect()} database: `, error.stack);
    throw error;
  }
  return db;
}

let initPromise;

module.exports = (connection        ) => {
  if (!connection && !initPromise) {
    logger.error('Missing connection string');
    throw new Error('Database: Missing connection string');
  }
  if (initPromise) {
    return initPromise;
  }
  initPromise = _initDatabase(connection);
  return initPromise;
};
