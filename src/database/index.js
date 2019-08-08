// @flow

const Sequelize = require('sequelize');
const logger = require('../lib/logger')('Database');

const options = {
  pool: {
    max: 8,
    min: 0,
    acquire: 20000,
    idle: 20000,
  },
  logging: (message:string) => logger.debug(message),
};


async function _initDatabase(connection: string) { // eslint-disable-line no-underscore-dangle
  const db = new Sequelize(connection, options);
  // Create tables in database
  try {
    logger.info(`Establishing ${db.getDialect()} database connection.`);
    await db.authenticate();
  } catch (error) {
    logger.error(`Failed to authenticate ${db.getDialect()} database: `, error.stack);
    throw error;
  }
  return db;
}

let initPromise;

module.exports = (connection: string) => {
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
