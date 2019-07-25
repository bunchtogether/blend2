// @flow

const { addShutdownHandler } = require('@bunchtogether/exit-handler');
const getExpressApp = require('./express-app');
const startHttpServer = require('./http-server');
const { getRouters, shutdownRouters } = require('../routers');
const logger = require('../lib/logger')('Server');
const { version } = require('../../package.json');

module.exports = async (port:number) => {
  const app = getExpressApp();
  const stopHttpServer = await startHttpServer(app, port);
  app.use(getRouters());

  const shutdown = async () => {
    logger.info('Shutting down');
    await shutdownRouters();
    try {
      await stopHttpServer();
    } catch (error) {
      if (error.stack) {
        logger.error('Error shutting down HTTP server:');
        error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
      } else {
        logger.error(`Error shutting down HTTP server: ${error.message}`);
      }
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
  logger.info(`Started Blend ${version}`);
  return shutdown;
};
