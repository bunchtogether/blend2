//      

const { Router } = require('express');
const adapters = require('../adapters');
const logger = require('../lib/logger')('Device API');

module.exports.getDeviceRouter = () => {
  logger.info('Attaching /api/1.0/device');

  const router = Router({ mergeParams: true });

  router.post('/api/1.0/device/power', async (req                 , res                  ) => {
    const { body: { power } } = req;
    if (typeof power !== 'boolean') {
      res.status(400).send('Missing required body parameter "power"');
      return;
    }

    const adapter = adapters.getActiveAdapter();
    if (!adapter) {
      res.status(400).send('Device not paired');
      return;
    }

    try {
      const pwr = await adapter.setPower(power);
      res.status(200).send({ power: pwr });
    } catch (error) {
      logger.error('Error setting power');
      logger.errorStack(error);
      res.status(400).send('Error setting power');
    }
  });

  router.post('/api/1.0/device/volume', async (req                 , res                  ) => {
    const { body: { volume } } = req;
    if (typeof volume !== 'number') {
      res.status(400).send('Missing required body parameter "volume"');
      return;
    }

    const adapter = adapters.getActiveAdapter();
    if (!adapter) {
      res.status(400).send('Device not paired');
      return;
    }

    try {
      const vol = await adapter.setVolume(volume);
      res.status(200).send({ volume: vol });
    } catch (error) {
      logger.error('Error setting volume');
      logger.errorStack(error);
      res.status(400).send('Error setting volume');
    }
  });

  router.post('/api/1.0/device/source', async (req                 , res                  ) => {
    const { body: { source } } = req;
    if (typeof source !== 'string') {
      res.status(400).send('Missing required body parameter "source"');
      return;
    }

    const adapter = adapters.getActiveAdapter();
    if (!adapter) {
      res.status(400).send('Device not paired');
      return;
    }

    try {
      const vol = await adapter.setSource(source);
      res.status(200).send({ source: vol });
    } catch (error) {
      logger.error('Error setting source');
      logger.errorStack(error);
      res.status(400).send('Error setting source');
    }
  });

  return router;
};
