//      

const { Router } = require('express');
const adapters = require('./adapters');
const logger = require('../lib/logger')('Pair API');

module.exports.getPairRouter = () => {
  logger.info('Attaching /api/1.0/pair');

  const router = Router({ mergeParams: true });

  router.post('/api/1.0/pair/discover', async (req                 , res                  ) => {
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

  router.post('/api/1.0/pair/start', async (req                 , res                  ) => {
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

  router.post('/api/1.0/pair', async (req                 , res                  ) => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).send('Missing request body');
      return;
    }
    const { data } = body;
    const activeAdapter = adapters.getActiveAdapter();
    if (!activeAdapter) {
      logger.error('Failed to pair: no active adapter');
      res.status(400).send('Failed to pair. Pairing not initialized');
    }

    try {
      const result = await activeAdapter.pair(data);
      console.log('PAIR RESULT', result);
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error pairing device');
      logger.errorStack(error);
      res.status(400).send('Error pairing device');
    }
  });

  return router;
};