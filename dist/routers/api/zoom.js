//      

const { Router } = require('express');
const zoom = require('../../zoom');
const logger = require('../../lib/logger')('Zoom API');

module.exports.getZoomRouter = () => {
  logger.info('Attaching zoom router');

  const router = Router({ mergeParams: true });

  router.post('/start', async (req                 , res                  ) => {
    const { body: { hostname, password } } = req;
    if (typeof hostname !== 'string') {
      res.status(400).send('Missing required body parameter "hostname"');
      return;
    }

    try {
      await zoom.startRoom(hostname, password);
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error initializing zoom room');
      logger.errorStack(error);
      res.status(400).send('Can not start zoom room');
    }
  });

  return router;
};