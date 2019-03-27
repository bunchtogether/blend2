// @flow

const startWebsocketServer = require('./uws-server');
const StaticServer = require('./static-server');
const Server = require('./server');
const logger = require('./lib/logger')('CLI');

const { addShutdownHandler, addPostShutdownHandler, runShutdownHandlers } = require('@bunchtogether/exit-handler');

let exitCode = 0;

const start = async ():Promise<void> => {
  const [uwsServer, stopWebsocketServer] = await startWebsocketServer('127.0.0.1', 61340);
  const server = new Server(uwsServer);
  const staticServer = new StaticServer(uwsServer);

  addShutdownHandler(async () => {
    await server.close();
    await stopWebsocketServer();
  }, (error:Error) => {
    if (error.stack) {
      logger.error('Error shutting down:');
      error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
    } else {
      logger.error(`Error shutting down: ${error.message}`);
    }
  });

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
