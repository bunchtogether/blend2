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
      return res.status(400).send('Missing required body parameter "meetingNumber"');
    }

    try {
      await zoom.joinMeeting(meetingNumber.toString(), password);
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Error joining meeting');
      logger.errorStack(error);
      return res.status(400).send('Can not join meeting');
    }
  });

  router.post('/leave', async (req                 , res                  ) => {
    try {
      await zoom.leaveMeeting();
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Error leaving meeting');
      logger.errorStack(error);
      return res.status(400).send('Can not leave meeting');
    }
  });

  router.post('/listparticipants', async (req                 , res                  ) => {
    try {
      const result = await zoom.listParticipants();
      return res.send(result);
    } catch (error) {
      logger.error('Error listing participants');
      logger.errorStack(error);
      return res.status(400).send('Unable to list participants');
    }
  });

  router.post('/audio/volume', async (req                 , res                  ) => {
    const volume = req.body.volume;
    if (!volume) {
      return res.status(400).send('Missing required body parameter "volume"');
    }
    try {
      await zoom.setVolume(volume);
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Error setting volume for zoom room');
      logger.errorStack(error);
      return res.status(400).send('Unable to set volume for zoom room');
    }
  });

  router.post('/mic/mute', async (req                 , res                  ) => {
    try {
      await zoom.muteMic();
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Error muting zoom room');
      logger.errorStack(error);
      return res.status(400).send('Unable to mute zoom room');
    }
  });

  router.post('/mic/unmute', async (req                 , res                  ) => {
    try {
      await zoom.unmuteMic();
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Error unmuting zoom room');
      logger.errorStack(error);
      return res.status(400).send('Unable to unmute zoom room');
    }
  });

  router.post('/video/enable', async (req                 , res                  ) => {
    try {
      await zoom.enableVideo();
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Error enabling zoom room video');
      logger.errorStack(error);
      return res.status(400).send('Unable to enable zoom room video');
    }
  });

  router.post('/video/disable', async (req                 , res                  ) => {
    try {
      await zoom.disableVideo();
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Error disabling zoom room video');
      logger.errorStack(error);
      return res.status(400).send('Unable to disable zoom room video');
    }
  });

  return router;
};
