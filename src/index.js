// @flow

const logger = require('./lib/logger')('CLI');

const getExpressApp = require('./express-app');
const startHttpServer = require('./http-server');
const getRouters = require('./routers');
const { setForegroundWindow } = require('./lib/picture-in-picture');
const initDatabase = require('./database');
const { initModels } = require('./models');
const { initAdapter, closeAdapter } = require('./adapters');
const { API_PORT, DATABASE_CONNECTION } = require('./constants');
const { addShutdownHandler, addPostShutdownHandler, runShutdownHandlers } = require('@bunchtogether/exit-handler');
const { version } = require('../package.json');

let exitCode = 0;

const start = async ():Promise<void> => {
  const db = await initDatabase(DATABASE_CONNECTION);
  const { Device } = await initModels(db);
  await initAdapter(Device);

  const app = getExpressApp();
  const stopHttpServer = await startHttpServer(app, API_PORT);
  const [routers, shutdownRouters] = getRouters(Device);
  app.use(routers);

  // Create tables in database

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

  const shutdown = async () => {
    logger.info('Shutting down');
    try {
      await closeAdapter();
    } catch (error) {
      logger.error('Error closing adapter');
      logger.errorStack(error);
    }
    try {
      await shutdownRouters();
    } catch (error) {
      logger.error('Error shutting down routers');
      logger.errorStack(error);
    }
    try {
      await stopHttpServer();
    } catch (error) {
      logger.error('Error shutting down HTTP server');
      logger.errorStack(error);
    }
    logger.info(`Shut down Blend ${version}`);
  };

  addShutdownHandler(shutdown, (error:Error) => {
    if (error.stack) {
      logger.error('Error shutting down:');
      error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
    } else {
      logger.error(`Error shutting down: ${error.message}`);
    }
  });

  try {
    await setForegroundWindow('chrome');
  } catch (error) {
    logger.error('Failed to bring chrome to front');
    logger.errorStack(error);
  }
};

addPostShutdownHandler(async () => {
  process.exit(exitCode);
});

start().catch((error) => {
  logger.error('Error starting:');
  logger.error(error.message);
  logger.errorStack(error);
  exitCode = 1;
  runShutdownHandlers();
});
