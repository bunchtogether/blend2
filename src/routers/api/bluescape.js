// @flow

const { Router } = require('express');
const bluescape = require('../../bluescape');
const logger = require('../../lib/logger')('Bluescape API');

module.exports.getBluescapeRouter = () => {
  logger.info('Attaching bluescape router');

  const router = Router({ mergeParams: true });

  router.post('/focus', async (req: express$Request, res: express$Response) => {
    try {
      await bluescape.focus();
      res.sendStatus(200);
    } catch (error) {
      logger.warn('Can not switch to Bluescape');
      logger.warn(error);
      res.status(400).send('Can not switch to Bluescape');
    }
  });

  return router;
};
