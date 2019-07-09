//      

const { Router } = require('express');
const logger = require('../lib/logger')('Device API');

module.exports.getDeviceRouter = () => {
  logger.info('Attaching device router');

  const router = Router({ mergeParams: true });

  router.post('/power', async (req                 , res                  ) => {
    const { body: { power } } = req;
    if (typeof power !== 'boolean') {
      res.status(400).send('Missing required body parameter "power"');
      return;
    }

    try {
      const pwr = await req.adapter.setPower(power);
      res.status(200).send({ power: pwr });
    } catch (error) {
      logger.error('Error setting power');
      logger.errorStack(error);
      res.status(400).send('Error setting power');
    }
  });

  router.post('/volume', async (req                 , res                  ) => {
    const { body: { volume } } = req;
    if (typeof volume !== 'number') {
      res.status(400).send('Missing required body parameter "volume"');
      return;
    }

    try {
      const vol = await req.adapter.setVolume(volume);
      res.status(200).send({ volume: vol });
    } catch (error) {
      logger.error('Error setting volume');
      logger.errorStack(error);
      res.status(400).send('Error setting volume');
    }
  });

  router.post('/source', async (req                 , res                  ) => {
    const { body: { source } } = req;
    if (typeof source !== 'string') {
      res.status(400).send('Missing required body parameter "source"');
      return;
    }

    try {
      const vol = await req.adapter.setSource(source);
      res.status(200).send({ source: vol });
    } catch (error) {
      logger.error('Error setting source');
      logger.errorStack(error);
      res.status(400).send('Error setting source');
    }
  });

  router.post('/mute', async (req                 , res                  ) => {
    const { body: { mute } } = req;
    if (typeof mute !== 'boolean') {
      res.status(400).send('Missing required body parameter "mute"');
      return;
    }

    try {
      const value = await req.adapter.setMute(mute);
      res.status(200).send({ mute: value });
    } catch (error) {
      logger.error('Error setting mute');
      logger.errorStack(error);
      res.status(400).send('Error setting mute');
    }
  });

  router.post('/cc', async (req                 , res                  ) => {
    try {
      await req.adapter.toggleCC();
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error setting cc');
      logger.errorStack(error);
      res.status(400).send('Error setting cc');
    }
  });

  return router;
};
