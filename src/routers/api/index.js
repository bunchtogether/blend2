// @flow

const express = require('express');
const { getPairRouter } = require('./pair');
const { getDeviceRouter } = require('./device');
const { getZoomRouter } = require('./zoom');
const { getLogsRouter } = require('./logs');
const { getCapabilitiesRouter } = require('./capabilities');
const adapterMiddleware = require('../middleware/adapter');

function getApiRouters() {
  const routers = express.Router({ mergeParams: true });

  routers.use('/capabilities', getCapabilitiesRouter());
  routers.use('/pair', getPairRouter());
  routers.use('/device', adapterMiddleware, getDeviceRouter());
  routers.use('/zoom', getZoomRouter());
  routers.use('/logs', getLogsRouter());

  return routers;
}

module.exports.getApiRouters = getApiRouters;
