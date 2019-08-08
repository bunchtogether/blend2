// @flow

const express = require('express');
const { getPairRouter } = require('./pair');
const { getDeviceRouter } = require('./device');
const getZoomRoomsRouter = require('./zoom');
const { getBluescapeRouter } = require('./bluescape');
const { getLogsRouter } = require('./logs');
const { getCapabilitiesRouter } = require('./capabilities');
const adapterMiddleware = require('../middleware/adapter');

function getApiRouters(Device:Object) {
  const routers = express.Router({ mergeParams: true });

  routers.use('/capabilities', getCapabilitiesRouter());
  routers.use('/pair', getPairRouter(Device));
  routers.use('/device', adapterMiddleware, getDeviceRouter());
  const [zoomRoomsRouter, shutdownZoomRoomsRouter] = getZoomRoomsRouter();
  routers.use('/zoom', zoomRoomsRouter);
  routers.use('/bluescape', getBluescapeRouter());
  routers.use('/logs', getLogsRouter());

  return [routers, async () => {
    await shutdownZoomRoomsRouter();
  }];
}

module.exports.getApiRouters = getApiRouters;
