//      

const { Router } = require('express');
const find = require('@bunchtogether/find-process');
const { getActiveInterfaceMac, getActiveInterfaceIPAddress } = require('../../lib/network');
const adapters = require('../../adapters');
const logger = require('../../lib/logger')('Capabilities API');

let bluescapeDetected = false;
let zoomRoomsDetected = false;

const checkIfBluescapeIsAvailable = async () => {
  if (bluescapeDetected) {
    return true;
  }
  const start = Date.now();
  const result = await find('name', 'tsx_winmaster', true);
  bluescapeDetected = Array.isArray(result) && result.length > 0;
  logger.info(`Bluescape check: ${Date.now() - start}`);
  return bluescapeDetected;
};

const checkIfZoomRoomIsAvailable = async () => {
  if (zoomRoomsDetected) {
    return true;
  }
  const start = Date.now();
  const result = await find('name', 'ZoomRooms', true);
  zoomRoomsDetected = Array.isArray(result) && result.length > 0;
  logger.info(`Zoom check: ${Date.now() - start}`);
  return zoomRoomsDetected;
};

checkIfBluescapeIsAvailable();
checkIfZoomRoomIsAvailable();

module.exports.getCapabilitiesRouter = () => {
  logger.info('Attaching capabilities router');

  const router = Router({ mergeParams: true });

  router.get('', async (req                 , res                  ) => {
    try {
      const start = Date.now();
      const [activeAdapter, isBluescapeAvailable, isZoomRoomAvailable, macAddress, ipAddress] = await Promise.all([
        adapters.getActiveAdapter(),
        checkIfBluescapeIsAvailable(),
        checkIfZoomRoomIsAvailable(),
        getActiveInterfaceMac(),
        getActiveInterfaceIPAddress(),
      ]);
      logger.info(`Capabilities check: ${Date.now() - start}`);
      res.status(200).send({
        isServerAvailable: true,
        isDeviceAvailable: activeAdapter && activeAdapter.ready,
        isBluescapeAvailable,
        isZoomRoomAvailable,
        macAddress,
        ipAddress,
        system: 1,
      });
    } catch (error) {
      logger.error('Unable to get capabilities');
      logger.errorStack(error);
      res.status(400).send({
        isServerAvailable: true,
        isDeviceAvailable: false,
        isBluescapeAvailable: false,
      });
    }
  });

  return router;
};
