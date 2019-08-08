// @flow

const { Router } = require('express');
const EventEmitter = require('events');
const crypto = require('crypto');
const zoom = require('../../zoom');
const logger = require('../../lib/logger')('Zoom Rooms API');

let active = false;

function randomInteger() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}

module.exports = () => {
  logger.info('Attaching Zoom Rooms router');

  const router = Router({ mergeParams: true });
  const emitter = new EventEmitter();
  //   Key: Socket ID
  //   Value: Socket object
  const sockets = new Map();

  router.ws('', async (ws:Object) => {
    if (!active) {
      ws.close(1000, 'Shutting down');
      return;
    }

    const handleData = (data) => {
      if (ws.readyState !== 1) {
        logger.error(`Cannot send message to socket ID ${socketId}, ready state is ${ws.readyState}`);
        return;
      }
      console.log(data);
      ws.send(JSON.stringify(data), { compress: false, binary: false });
    };

    const handleError = () => {
      ws.close(1001, 'Zoom Rooms connnection error');
    };

    const handleClose = () => {
      ws.close(1000, 'Zoom Rooms connnection closed');
    };

    emitter.on('data', handleData);
    emitter.on('error', handleError);
    emitter.on('close', handleClose);

    const socketId = randomInteger();
    sockets.set(socketId, ws);
    logger.info(`Opened socket ID ${socketId}`);

    let hearteatTimeout;

    ws.on('message', (event) => {
      clearTimeout(hearteatTimeout);
      hearteatTimeout = setTimeout(() => {
        logger.warn(`Terminating socket ID ${socketId} after heartbeat timeout`);
        ws.terminate();
      }, 6000);
      console.log(!!event);
    });

    ws.on('close', () => {
      emitter.removeListener('data', handleData);
      emitter.removeListener('error', handleError);
      emitter.removeListener('close', handleClose);
      clearTimeout(hearteatTimeout);
      try {
        logger.info(`Closed socket ${socketId}`);
        sockets.delete(socketId);
      } catch (error) {
        if (error.stack) {
          logger.error('Error closing websocket:');
          error.stack.split('\n').forEach((line) => logger.error(`\t${line}`));
        } else {
          logger.error(`Error closing websocket: ${error.message}`);
        }
      }
    });

    if (!sockets.has(socketId)) {
      logger.error('Not starting stream, socket closed');
    }
  });

  router.post('/check', async (req: express$Request, res: express$Response) => {
    const { body: { password } } = req;
    try {
      const client = await zoom.connect(password);
      const handleConfiguration = (key:string, data:Object) => {
        emitter.emit('data', ['zConfiguration', key, data]);
      };
      const handleStatus = (key:string, data:Object) => {
        emitter.emit('data', ['zStatus', key, data]);
      };
      const handleCommand = (key:string, data:Object) => {
        emitter.emit('data', ['zCommand', key, data]);
      };
      const handleError = (error) => {
        logger.error('Zoom Rooms client error');
        logger.errorStack(error);
        emitter.emit('error', error);
        client.removeListener('zConfiguration', handleConfiguration);
        client.removeListener('zStatus', handleStatus);
        client.removeListener('zCommand', handleCommand);
        client.removeListener('error', handleError);
        client.removeListener('close', handleClose);
      };
      const handleClose = () => {
        logger.info('Zoom Rooms client closed');
        emitter.emit('error', close);
        client.removeListener('zConfiguration', handleConfiguration);
        client.removeListener('zStatus', handleStatus);
        client.removeListener('zCommand', handleCommand);
        client.removeListener('error', handleError);
        client.removeListener('close', handleClose);
      };
      client.on('zConfiguration', handleConfiguration);
      client.on('zStatus', handleStatus);
      client.on('zCommand', handleCommand);
      client.on('error', handleError);
      client.on('close', handleClose);
      res.sendStatus(200);
    } catch (error) {
      logger.warn('Zoom rooms not available');
      logger.warn(error);
      res.status(400).send('Zoom rooms not available');
    }
  });

  router.post('/join', async (req: express$Request, res: express$Response) => {
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

  router.post('/leave', async (req: express$Request, res: express$Response) => {
    try {
      await zoom.leaveMeeting();
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Error leaving meeting');
      logger.errorStack(error);
      return res.status(400).send('Can not leave meeting');
    }
  });

  router.post('/phone-call-out', async (req: express$Request, res: express$Response) => {
    const { body: { number, password } } = req;
    if (!number) {
      return res.status(400).send('Missing required body parameter "number"');
    }

    try {
      await zoom.phoneCallOut(number.toString(), password);
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Error making phone call');
      logger.errorStack(error);
      return res.status(400).send('Can not phone call out');
    }
  });

  router.post('/listparticipants', async (req: express$Request, res: express$Response) => {
    try {
      const result = await zoom.listParticipants();
      return res.send(result);
    } catch (error) {
      logger.error('Error listing participants');
      logger.errorStack(error);
      return res.status(400).send('Unable to list participants');
    }
  });

  router.post('/audio/volume', async (req: express$Request, res: express$Response) => {
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

  router.post('/mic/mute', async (req: express$Request, res: express$Response) => {
    try {
      await zoom.muteMic();
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Error muting zoom room');
      logger.errorStack(error);
      return res.status(400).send('Unable to mute zoom room');
    }
  });

  router.post('/mic/unmute', async (req: express$Request, res: express$Response) => {
    try {
      await zoom.unmuteMic();
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Error unmuting zoom room');
      logger.errorStack(error);
      return res.status(400).send('Unable to unmute zoom room');
    }
  });

  router.post('/video/enable', async (req: express$Request, res: express$Response) => {
    try {
      await zoom.enableVideo();
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Error enabling zoom room video');
      logger.errorStack(error);
      return res.status(400).send('Unable to enable zoom room video');
    }
  });

  router.post('/video/disable', async (req: express$Request, res: express$Response) => {
    try {
      await zoom.disableVideo();
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Error disabling zoom room video');
      logger.errorStack(error);
      return res.status(400).send('Unable to disable zoom room video');
    }
  });

  return [router, async () => {
    active = false;
    logger.info('Closing');
    for (const socket of sockets.values()) {
      socket.close(1000, 'Shutting down');
    }
    const timeout = Date.now() + 10000;
    while (sockets.size > 0 && Date.now() < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (Date.now() > timeout) {
      logger.warn('Closed');
    } else {
      logger.info('Closed');
    }
  }];
};
