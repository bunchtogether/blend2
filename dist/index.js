//      

const logger = require('./lib/logger')('CLI');
const startServer = require('./server');
const initDatabase = require('./database');
const { initModels } = require('./models');
const { initAdapters } = require('./adapters');
const { API_PORT, DATABASE_CONNECTION } = require('./constants');
const { addPostShutdownHandler, runShutdownHandlers } = require('@bunchtogether/exit-handler');

let exitCode = 0;

const start = async ()               => {
  await startServer(API_PORT);
  const db = await initDatabase(DATABASE_CONNECTION);
  await initModels(db);
  await initAdapters();

  process.on('uncaughtException', (error) => {
    if (error.stack) {
      logger.error('Uncaught exception:');
      error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
    } else {
      logger.error(`Uncaught exception: ${error.message}`);
    }
    exitCode = 1;
    runShutdownHandlers();
  });

  process.on('unhandledRejection', (error) => {
    if (error.stack) {
      logger.error('Unhandled rejection:');
      error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
    } else {
      logger.error(`Unhandled rejection: ${error.message}`);
    }
    exitCode = 1;
    runShutdownHandlers();
  });

  addPostShutdownHandler(() => {
    process.exit(exitCode);
  });
};

start().catch((error) => {
  if (error.stack) {
    logger.error('Error starting:');
    error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
  } else {
    logger.error(`Error starting: ${error.message}`);
  }
  logger.error(error.message);
  exitCode = 1;
  runShutdownHandlers();
});
