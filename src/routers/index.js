// @flow

const path = require('path');
const express = require('express');
const { getStreamRouter, shutdownStreamRouter } = require('./stream');
const { getMulticastAssistRouter, shutdownMulticastAssistRouter } = require('./multicast-assist');
const { getLogRouter } = require('./log');
const { getApiRouters } = require('./api');
const logger = require('../lib/logger')('Routers');

module.exports = (levelDb:Object) => {
  const routers = express.Router({ mergeParams: true });
  routers.use(getStreamRouter());
  routers.use(getMulticastAssistRouter());
  routers.use(getLogRouter());
  routers.use('/static', express.static(path.join(process.cwd(), 'static')));
  routers.use('/api/1.0/stream/:url', express.static(path.join(process.cwd(), 'dist-www')));
  routers.use('/api/1.0/ffmpeg/:args', express.static(path.join(process.cwd(), 'dist-www')));
  routers.use(['/remote*', '/stream*', '/'], express.static(path.join(process.cwd(), 'dist-www')));
  const [apiRouters, shutdownApiRouters] = getApiRouters(levelDb);
  routers.use('/api/1.0', apiRouters);
  return [routers, async () => {
    try {
      await shutdownApiRouters();
    } catch (error) {
      logger.error('Error shutting down API routers');
      logger.errorStack(error);
    }
    try {
      await shutdownStreamRouter();
    } catch (error) {
      logger.error('Error shutting down stream router');
      logger.errorStack(error);
    }
    try {
      await shutdownMulticastAssistRouter();
    } catch (error) {
      logger.error('Error shutting down multicast assist router');
      logger.errorStack(error);
    }
  }];
};
