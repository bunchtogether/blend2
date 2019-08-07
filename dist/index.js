//      

const logger = require('./lib/logger')('CLI');
const { setForegroundWindow } = require('./lib/picture-in-picture');
const startServer = require('./server');
const initDatabase = require('./database');
const { initModels } = require('./models');
const { initAdapter, closeAdapter } = require('./adapters');
const { API_PORT, DATABASE_CONNECTION } = require('./constants');
const { addPostShutdownHandler, runShutdownHandlers } = require('@bunchtogether/exit-handler');

let exitCode = 0;

const start = async ()               => {
  await startServer(API_PORT);
  const db = await initDatabase(DATABASE_CONNECTION);
  await initModels(db);
  await initAdapter();

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

  addPostShutdownHandler(async () => {
    await closeAdapter();
    process.exit(exitCode);
  });

  try {
    await setForegroundWindow('chrome');
  } catch (error) {
    logger.error('Failed to bring chrome to front');
    logger.errorStack(error);
  }
};

start().catch((error) => {
  logger.error('Error starting:');
  logger.error(error.message);
  logger.errorStack(error);
  exitCode = 1;
  runShutdownHandlers();
});
