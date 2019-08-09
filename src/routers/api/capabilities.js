// @flow

const { Router } = require('express');
const adapters = require('../../adapters');
const bluescape = require('../../bluescape');
const zoom = require('../../zoom');
const logger = require('../../lib/logger')('Capabilities API');

module.exports.getCapabilitiesRouter = () => {
  logger.info('Attaching capabilities router');

  const router = Router({ mergeParams: true });

  router.get('', async (req: express$Request, res: express$Response) => {
    try {
      const [activeAdapter, isBluescapeAvailable, isZoomRoomAvailable] = await Promise.all([
        adapters.getActiveAdapter(),
        bluescape.isAvailable(),
        zoom.isAvailable()
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
