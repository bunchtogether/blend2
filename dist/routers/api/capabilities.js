//      

const { Router } = require('express');
const adapters = require('../../adapters');
const bluescape = require('../../bluescape');
const logger = require('../../lib/logger')('Capabilities API');

module.exports.getCapabilitiesRouter = () => {
  logger.info('Attaching capabilities router');

  const router = Router({ mergeParams: true });

  router.get('', async (req                 , res                  ) => {
    try {
      const activeAdapter = await adapters.getActiveAdapter();
      const isBluescapeAvailable = await bluescape.isAvailable();
      res.status(200).send({
        isServerAvailable: true,
        isDeviceAvailable: activeAdapter && activeAdapter.ready,
        isBluescapeAvailable,
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
