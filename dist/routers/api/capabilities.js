//      

const { Router } = require('express');
const find = require('find-process');
const adapters = require('../../adapters');
const logger = require('../../lib/logger')('Capabilities API');

let bluescapeDetected = false;
let zoomRoomsDetected = false;

const checkIfBluescapeIsAvailable = async () => {
  if (bluescapeDetected) {
    return true;
  }
  const result = await find('name', 'tsx_winmaster', true);
  bluescapeDetected = Array.isArray(result) && result.length > 0;
  return bluescapeDetected;
};

const checkIfZoomRoomIsAvailable = async () => {
  if (zoomRoomsDetected) {
    return true;
  }
  const result = await find('name', 'ZoomRooms', true);
  zoomRoomsDetected = Array.isArray(result) && result.length > 0;
  return zoomRoomsDetected;
};

checkIfBluescapeIsAvailable();
checkIfZoomRoomIsAvailable();

module.exports.getCapabilitiesRouter = () => {
  logger.info('Attaching capabilities router');

  const router = Router({ mergeParams: true });

  router.get('', async (req                 , res                  ) => {
    try {
      const [activeAdapter, isBluescapeAvailable, isZoomRoomAvailable] = await Promise.all([
        adapters.getActiveAdapter(),
        checkIfBluescapeIsAvailable(),
        checkIfZoomRoomIsAvailable(),
      ]);
      res.status(200).send({
        isServerAvailable: true,
        isDeviceAvailable: activeAdapter && activeAdapter.ready,
        isBluescapeAvailable,
        isZoomRoomAvailable,
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
