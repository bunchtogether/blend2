// @flow

const { Router } = require('express');
const adapters = require('../adapters');
const { getDevice } = require('../models');
const logger = require('../lib/logger')('Pair API');

module.exports.getPairRouter = () => {
  logger.info('Attaching pair router');

  const router = Router({ mergeParams: true });

  router.post('/discover', async (req: express$Request, res: express$Response) => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).send('Missing request body');
      return;
    }
    const { type } = body;
    if (typeof type !== 'string') {
      res.status(400).send('Missing required body parameter "type"');
      return;
    }
    const adapter = adapters[type];
    if (!adapter) {
      res.status(400).send(`Unknown adapter type "${type}"`);
    }

    try {
      const devices = await adapter.discover();
      res.status(200).send({ devices });
    } catch (error) {
      logger.error('Error discovering devices');
      logger.errorStack(error);
      res.status(400).send('Error discovering devices');
    }
  });

  router.post('/start', async (req: express$Request, res: express$Response) => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).send('Missing request body');
      return;
    }
    const { type, data } = body;
    if (typeof type !== 'string') {
      res.status(400).send('Missing required body parameter "type"');
      return;
    }
    const Adapter = adapters[type];
    if (!Adapter) {
      res.status(400).send(`Unknown adapter type "${type}"`);
    }

    try {
      const adapterInstance = new Adapter(data);
      adapters.setActiveAdapter(adapterInstance);
      await adapterInstance.initialize();
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error initializing device');
      logger.errorStack(error);
      res.status(400).send('Error initializing device');
    }
  });

  router.post('', async (req: express$Request, res: express$Response) => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).send('Missing request body');
      return;
    }
    const { data } = body;
    const activeAdapter = await adapters.getActiveAdapter();
    if (!activeAdapter) {
      logger.error('Failed to pair: no active adapter');
      res.status(400).send('Failed to pair. Pairing not initialized');
      return;
    }

    try {
      const result = await activeAdapter.pair(data);
      logger.info(`Pairing info: ${JSON.stringify(result)}`);
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error pairing device');
      logger.errorStack(error);
      res.status(400).send('Error pairing device');
    }
  });

  router.get('', async (req: express$Request, res: express$Response) => {
    const activeAdapter = await adapters.getActiveAdapter();
    if (!activeAdapter || !activeAdapter.ready) {
      res.status(200).send({ device: null });
      return;
    }
    try {
      const device = await activeAdapter.getDevice();
      res.status(200).send({ device });
    } catch (error) {
      logger.error('Unable to get paired device');
      logger.errorStack(error);
      res.status(400).send('Unable to get paired device');
    }
  });

  router.post('/remove', async (req: express$Request, res: express$Response) => {
    const activeAdapter = await adapters.getActiveAdapter();
    if (activeAdapter && activeAdapter.close) {
      await activeAdapter.close();
    }
    const device = await getDevice();
    await device.update({
      type: null,
      data: null,
    });
    adapters.setActiveAdapter(null);
    res.sendStatus(200);
  });

  return router;
};
