// @flow

const { Router } = require('express');
const zoom = require('../../zoom');
const logger = require('../../lib/logger')('Zoom API');

module.exports.getZoomRouter = () => {
  logger.info('Attaching zoom router');

  const router = Router({ mergeParams: true });

  router.post('/join', async (req: express$Request, res: express$Response) => {
    const { body: { meetingNumber, password } } = req;
    if (typeof meetingNumber !== 'string') {
      res.status(400).send('Missing required body parameter "meetingNumber"');
      return;
    }

    try {
      await zoom.joinMeeting(meetingNumber, password);
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error joining meeting');
      logger.errorStack(error);
      res.status(400).send('Can not join meeting');
    }
  });

  router.post('/leave', async (req: express$Request, res: express$Response) => {
    try {
      await zoom.leaveMeeting();
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error leaving meeting');
      logger.errorStack(error);
      res.status(400).send('Can not leave meeting');
    }
  });

  return router;
};
