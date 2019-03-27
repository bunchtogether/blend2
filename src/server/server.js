// @flow

const path = require('path');
const express = require('express');
const { addShutdownHandler } = require('@bunchtogether/exit-handler');
const getExpressApp = require('./express-app');
const startHttpServer = require('./http-server');
const { getStreamRouter, shutdownStreamRouter } = require('./stream-router');
const { getLogRouter } = require('./log-router');
const logger = require('./lib/logger')('Server');
const { version } = require('../../package.json');

module.exports = async (port:number) => {
  const app = getExpressApp();
  app.use(getLogRouter());
  app.use('/api/1.0/stream/:url', express.static(path.join(__dirname, '../static/player')));
  app.use('/api/1.0/ffmpeg/:args', express.static(path.join(__dirname, '../static/player')));
  app.use('', express.static(path.join(__dirname, '../static')));
  const stopHttpServer = await startHttpServer(app, port);
  app.use(getStreamRouter());
  const shutdown = async () => {
    logger.info('Shutting down');
    try {
      await shutdownStreamRouter();
    } catch (error) {
      if (error.stack) {
        logger.error('Error shutting down stream router:');
        error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
      } else {
        logger.error(`Error shutting down stream router: ${error.message}`);
      }
    }
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
