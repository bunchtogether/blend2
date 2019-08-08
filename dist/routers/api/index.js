//      

const express = require('express');
const { getPairRouter } = require('./pair');
const { getDeviceRouter } = require('./device');
const getZoomRoomRouter = require('./zoom-room');
const { getBluescapeRouter } = require('./bluescape');
const { getLogsRouter } = require('./logs');
const { getCapabilitiesRouter } = require('./capabilities');
const adapterMiddleware = require('../middleware/adapter');

function getApiRouters(Device       ) {
  const routers = express.Router({ mergeParams: true });

  routers.use('/capabilities', getCapabilitiesRouter());
  routers.use('/pair', getPairRouter(Device));
  routers.use('/device', adapterMiddleware, getDeviceRouter());
  const [zoomRoomRouter, shutdownZoomRoomsRouter] = getZoomRoomRouter();
  routers.use('/zoom-room', zoomRoomRouter);
  routers.use('/bluescape', getBluescapeRouter());
  routers.use('/logs', getLogsRouter());

  return [routers, async () => {
    await shutdownZoomRoomsRouter();
  }];
}

module.exports.getApiRouters = getApiRouters;
