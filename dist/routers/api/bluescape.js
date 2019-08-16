//      

const { Router } = require('express');
const { switchToApp } = require('../../lib/window-control');
const logger = require('../../lib/logger')('Bluescape API');

module.exports.getBluescapeRouter = () => {
  logger.info('Attaching bluescape router');

  const router = Router({ mergeParams: true });

  router.post('/focus', async (req                 , res                  ) => {
    try {
      await switchToApp('tsx_winslave', 10, 100);
      res.sendStatus(200);
    } catch (error) {
      logger.warn('Can not switch to Bluescape');
      logger.warn(error);
      res.status(400).send('Can not switch to Bluescape');
    }
  });

  return router;
};
