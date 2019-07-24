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

  router.post('/audio/volume', async (req                 , res                  ) => {
    const volume = req.body.volume;
    if (!volume) {
      res.status(400).send('Missing required body parameter "volume"');
      return;
    }
    try {
      await zoom.setVolume(volume);
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error setting volume for zoom room');
      logger.errorStack(error);
      res.status(400).send('Unable to set volume for zoom room');
    }
  });

  router.post('/mic/mute', async (req                 , res                  ) => {
    try {
      await zoom.muteMic();
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error muting zoom room');
      logger.errorStack(error);
      res.status(400).send('Unable to mute zoom room');
    }
  });

  router.post('/mic/unmute', async (req                 , res                  ) => {
    try {
      await zoom.unmuteMic();
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error unmuting zoom room');
      logger.errorStack(error);
      res.status(400).send('Unable to unmute zoom room');
    }
  });

  router.post('/video/enable', async (req                 , res                  ) => {
    try {
      await zoom.enableVideo();
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error enabling zoom room video');
      logger.errorStack(error);
      res.status(400).send('Unable to enable zoom room video');
    }
  });

  router.post('/video/disable', async (req                 , res                  ) => {
    try {
      await zoom.disableVideo();
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error disabling zoom room video');
      logger.errorStack(error);
      res.status(400).send('Unable to disable zoom room video');
    }
  });

  return router;
};
