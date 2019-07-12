// @flow

const path = require('path');
const express = require('express');
const { getStreamRouter, shutdownStreamRouter } = require('./stream');
const { getMulticastAssistRouter, shutdownMulticastAssistRouter } = require('./multicast-assist');
const { getLogRouter } = require('./log');
const { getPairRouter } = require('./pair');
const { getDeviceRouter } = require('./device');
const { getCapabilitiesRouter } = require('./capabilities');
const adapterMiddleware = require('./middleware/adapter');
const logger = require('../lib/logger')('Routers');

function getRouters() {
  const routers = express.Router({ mergeParams: true });

  routers.use(getStreamRouter());
  routers.use(getMulticastAssistRouter());
  routers.use(getLogRouter());
  routers.use('/api/1.0/stream/:url', express.static(path.join(process.cwd(), 'dist-www')));
  routers.use('/api/1.0/ffmpeg/:args', express.static(path.join(process.cwd(), 'dist-www')));
  routers.use(['/remote*', '/stream*', '/'], express.static(path.join(process.cwd(), 'dist-www')));
  routers.use('/api/1.0/capabilities', getCapabilitiesRouter());
  routers.use('/api/1.0/pair', getPairRouter());
  routers.use('/api/1.0/device', adapterMiddleware, getDeviceRouter());

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
