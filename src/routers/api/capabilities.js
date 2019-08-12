// @flow

const { Router } = require('express');
const find = require('find-process');
const adapters = require('../../adapters');
const logger = require('../../lib/logger')('Capabilities API');

const checkIfBluescapeIsAvailable = async () => {
  const result = await find('name', 'tsx_winmaster', true);
  return Array.isArray(result) && result.length > 0;
};

const checkIfZoomRoomIsAvailable = async () => {
  const result = await find('name', 'ZoomRooms', true);
  return Array.isArray(result) && result.length > 0;
};

module.exports.getCapabilitiesRouter = () => {
  logger.info('Attaching capabilities router');

  const router = Router({ mergeParams: true });

  router.get('', async (req: express$Request, res: express$Response) => {
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
