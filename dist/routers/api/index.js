//      

const express = require('express');
const { getPairRouter } = require('./pair');
const { getDeviceRouter } = require('./device');
const { getZoomRouter } = require('./zoom');
const { getCapabilitiesRouter } = require('./capabilities');
const adapterMiddleware = require('../middleware/adapter');

function getApiRouters() {
  const routers = express.Router({ mergeParams: true });

  routers.use('/capabilities', getCapabilitiesRouter());
  routers.use('/pair', getPairRouter());
  routers.use('/device', adapterMiddleware, getDeviceRouter());
  routers.use('/zoom', getZoomRouter());

  return routers;
}

module.exports.getApiRouters = getApiRouters;
