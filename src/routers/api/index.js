// @flow

const express = require('express');
const { getPairRouter } = require('./pair');
const { getDeviceRouter } = require('./device');
const getZoomRoomRouter = require('./zoom-room');
const { getBluescapeRouter } = require('./bluescape');
const { getLogsRouter } = require('./logs');
const { getSetupRouter } = require('./setup');
const { getSystemRouter } = require('./system');
const { getCapabilitiesRouter } = require('./capabilities');
const adapterMiddleware = require('../middleware/adapter');

function getApiRouters(levelDb:Object) {
  const routers = express.Router({ mergeParams: true });

  routers.use('/capabilities', getCapabilitiesRouter());
  routers.use('/pair', getPairRouter(levelDb));
  routers.use('/device', adapterMiddleware, getDeviceRouter());
  const [zoomRoomRouter, shutdownZoomRoomsRouter] = getZoomRoomRouter();
  routers.use('/zoom-room', zoomRoomRouter);
  routers.use('/bluescape', getBluescapeRouter());
  routers.use('/logs', getLogsRouter());
  routers.use('/setup', getSetupRouter());
  routers.use('/system', getSystemRouter());

  return [routers, async () => {
    await shutdownZoomRoomsRouter();
  }];
}

module.exports.getApiRouters = getApiRouters;
