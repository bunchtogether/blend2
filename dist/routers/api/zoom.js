//      

const { Router } = require('express');
const zoom = require('../../zoom');
const logger = require('../../lib/logger')('Zoom API');

module.exports.getZoomRouter = () => {
  logger.info('Attaching zoom router');

  const router = Router({ mergeParams: true });

  router.post('/join', async (req                 , res                  ) => {
    const { body: { meetingNumber, password } } = req;
    if (!meetingNumber) {
      res.status(400).send('Missing required body parameter "meetingNumber"');
      return;
    }

    try {
      await zoom.joinMeeting(meetingNumber.toString(), password);
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error joining meeting');
      logger.errorStack(error);
      res.status(400).send('Can not join meeting');
    }
  });

  router.post('/leave', async (req                 , res                  ) => {
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
