// @flow

const path = require('path');
const express = require('express');
const { getStreamRouter, shutdownStreamRouter } = require('./stream');
const { getMulticastAssistRouter, shutdownMulticastAssistRouter } = require('./multicast-assist');
const { getLogRouter } = require('./log');
const { getApiRouters } = require('./api');
const logger = require('../lib/logger')('Routers');

function getRouters() {
  const routers = express.Router({ mergeParams: true });

  routers.use(getStreamRouter());
  routers.use(getMulticastAssistRouter());
  routers.use(getLogRouter());
  routers.use('/api/1.0/stream/:url', express.static(path.join(process.cwd(), 'dist-www')));
  routers.use('/api/1.0/ffmpeg/:args', express.static(path.join(process.cwd(), 'dist-www')));
  routers.use(['/remote*', '/stream*', '/'], express.static(path.join(process.cwd(), 'dist-www')));
  routers.use('/api/1.0', getApiRouters());
  return routers;
}

module.exports.getRouters = getRouters;

module.exports.shutdownRouters = async () => {
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
    await shutdownMulticastAssistRouter();
  } catch (error) {
    if (error.stack) {
      logger.error('Error shutting down multicast assist router:');
      error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
    } else {
      logger.error(`Error shutting down multicast assist router: ${error.message}`);
    }
  }
};
