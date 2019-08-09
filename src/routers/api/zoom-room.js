// @flow

/* eslint-disable camelcase */

const { Router } = require('express');
const { setForegroundWindow } = require('../../lib/picture-in-picture');
const crypto = require('crypto');
const ZoomRoomsControlSystem = require('@bunchtogether/zoom-rooms-control-system');
const logger = require('../../lib/logger')('Zoom Rooms API');

function randomInteger() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}

module.exports = () => {
  logger.info('Attaching Zoom Rooms router');

  let active = false;
  let zrcs;
  const router = Router({ mergeParams: true });

  const sockets = new Map();

  router.ws('/socket/:passcode', async (ws:Object, req: express$Request) => {
    logger.info('Zoom Room Control System incoming connection');

    if (!active) {
      ws.close(1000, 'Shutting down');
      return;
    }

    const passcode = req.params.passcode;

    const zoomRoomsControlSystem = new ZoomRoomsControlSystem('127.0.0.1', passcode || '');

    const handleConfiguration = (key:string, data:Object) => {
      if (ws.readyState !== 1) {
        logger.error(`Cannot send message to socket ID ${socketId}, ready state is ${ws.readyState}`);
        return;
      }
      ws.send(JSON.stringify(['zConfiguration', key, data]), { compress: false, binary: false });
    };

    const handleStatus = (key:string, data:Object) => {
      if (key === 'Call' && data.Status === 'NOT_IN_MEETING') {
        setForegroundWindow('chrome').catch((error) => {
          logger.error('Set foreground window failed when switching to Chrome');
          logger.errorStack(error);
        });
      }
      if (ws.readyState !== 1) {
        logger.error(`Cannot send message to socket ID ${socketId}, ready state is ${ws.readyState}`);
        return;
      }
      ws.send(JSON.stringify(['zStatus', key, data]), { compress: false, binary: false });
    };

    const handleCommand = (key:string, data:Object) => {
      if (ws.readyState !== 1) {
        logger.error(`Cannot send message to socket ID ${socketId}, ready state is ${ws.readyState}`);
        return;
      }
      ws.send(JSON.stringify(['zCommand', key, data]), { compress: false, binary: false });
    };

    const handleError = (error) => {
      logger.error('Zoom Room Control System error');
      logger.errorStack(error);
      ws.close(1001, 'Zoom Room Control System error');
      if (!zrcs) {
        return;
      }
      zrcs.removeListener('zConfiguration', handleConfiguration);
      zrcs.removeListener('zStatus', handleStatus);
      zrcs.removeListener('zCommand', handleCommand);
      zrcs.removeListener('error', handleError);
      zrcs.removeListener('close', handleClose);
      zrcs = null;
    };

    const handleClose = () => {
      logger.info('Zoom Room Control System closed');
      ws.close(1000, 'Zoom Room Control System closed');
      if (!zrcs) {
        return;
      }
      zrcs.removeListener('zConfiguration', handleConfiguration);
      zrcs.removeListener('zStatus', handleStatus);
      zrcs.removeListener('zCommand', handleCommand);
      zrcs.removeListener('error', handleError);
      zrcs.removeListener('close', handleClose);
      zrcs = null;
    };

    zoomRoomsControlSystem.on('zConfiguration', handleConfiguration);
    zoomRoomsControlSystem.on('zStatus', handleStatus);
    zoomRoomsControlSystem.on('zCommand', handleCommand);
    zoomRoomsControlSystem.on('error', handleError);
    zoomRoomsControlSystem.on('close', handleClose);

    zoomRoomsControlSystem.connect(passcode).then(() => {
      zrcs = zoomRoomsControlSystem;
      logger.info('Connected to Zoom Room Control System');
    }).catch((error) => {
      ws.close(1001, 'Zoom Room Control System connection error');
      logger.error('Unable to connect to Zoom Room');
      logger.errorStack(error);
    });

    const socketId = randomInteger();
    sockets.set(socketId, ws);
    logger.info(`Opened socket ID ${socketId}`);

    let heartbeatTimeout;

    const heartbeatTimeoutFunction = () => {
      logger.warn(`Terminating socket ID ${socketId} after heartbeat timeout`);
      ws.terminate();
    };

    ws.on('message', () => {
      clearTimeout(heartbeatTimeout);
      heartbeatTimeout = setTimeout(heartbeatTimeoutFunction, 6000);
    });

    ws.on('close', () => {
      if (zrcs) {
        zrcs.removeListener('zConfiguration', handleConfiguration);
        zrcs.removeListener('zStatus', handleStatus);
        zrcs.removeListener('zCommand', handleCommand);
        zrcs.removeListener('error', handleError);
        zrcs.removeListener('close', handleClose);
        logger.info('Disconnecting from Zoom Room Control System');
        zrcs.disconnect().then(() => {
          logger.info('Disconnected from Zoom Room Control System');
        }).catch((error) => {
          logger.error('Zoom Room Control System disconnect error');
          logger.errorStack(error);
        });
        zrcs = null;
      }
      clearTimeout(heartbeatTimeout);
      logger.info(`Closed socket ${socketId}`);
      sockets.delete(socketId);
    });
  });

  router.post('/zcommand.dial.start', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { meetingNumber } } = req;
    if (!meetingNumber) {
      return res.status(400).send('Missing required body parameter "meetingNumber"');
    }
    if (typeof meetingNumber !== 'string') {
      return res.status(400).send('Missing required body parameter "meetingNumber" with type string');
    }
    try {
      const response = await zrcs.zcommand.dial.start();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.dial.start');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.dial.start');
    }
  });


  router.post('/zcommand.dial.startPMI', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { duration } } = req;
    if (!duration) {
      return res.status(400).send('Missing required body parameter "duration"');
    }
    if (typeof duration !== 'number') {
      return res.status(400).send('Missing required body parameter "duration" with type number');
    }
    try {
      const response = await zrcs.zcommand.dial.startPMI({ duration });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.dial.startPMI');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.dial.startPMI');
    }
  });


  router.post('/zcommand.dial.join', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { meetingNumber } } = req;
    if (!meetingNumber) {
      return res.status(400).send('Missing required body parameter "meetingNumber"');
    }
    if (typeof meetingNumber !== 'string') {
      return res.status(400).send('Missing required body parameter "meetingNumber" with type string');
    }
    try {
      const response = await zrcs.zcommand.dial.join({ meetingNumber });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.dial.join');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.dial.join');
    }
  });


  router.post('/zcommand.call.disconnect', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zcommand.call.disconnect();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.disconnect');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.disconnect');
    }
  });


  router.post('/zcommand.call.info', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zcommand.call.info();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.info');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.info');
    }
  });


  router.post('/zcommand.call.muteAll', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { mute } } = req;
    if (!mute) {
      return res.status(400).send('Missing required body parameter "mute"');
    }
    if (mute !== 'on' && mute !== 'off') {
      return res.status(400).send('Missing required body parameter "mute" with value "on" or "off"');
    }
    try {
      const response = await zrcs.zcommand.call.muteAll({ mute });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.muteAll');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.muteAll');
    }
  });


  router.post('/zcommand.call.muteParticipant', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { mute, id } } = req;
    if (!mute) {
      return res.status(400).send('Missing required body parameter "mute"');
    }
    if (mute !== 'on' && mute !== 'off') {
      return res.status(400).send('Missing required body parameter "mute" with value "on" or "off"');
    }
    if (!id) {
      return res.status(400).send('Missing required body parameter "id"');
    }
    if (typeof id !== 'string') {
      return res.status(400).send('Missing required body parameter "id" with type number');
    }
    try {
      const response = await zrcs.zcommand.call.muteParticipant({ mute, id });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.muteParticipant');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.muteParticipant');
    }
  });


  router.post('/zcommand.call.listParticipants', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zcommand.call.listParticipants();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.listParticipants');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.listParticipants');
    }
  });


  router.post('/zcommand.call.accept', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { callerJID } } = req;
    if (!callerJID) {
      return res.status(400).send('Missing required body parameter "callerJID"');
    }
    if (typeof callerJID !== 'string') {
      return res.status(400).send('Missing required body parameter "callerJID" with type string');
    }
    try {
      const response = await zrcs.zcommand.call.accept({ callerJID });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.accept');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.accept');
    }
  });


  router.post('/zcommand.call.reject', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { callerJID } } = req;
    if (!callerJID) {
      return res.status(400).send('Missing required body parameter "callerJID"');
    }
    if (typeof callerJID !== 'string') {
      return res.status(400).send('Missing required body parameter "callerJID" with type string');
    }
    try {
      const response = await zrcs.zcommand.call.reject({ callerJID });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.reject');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.reject');
    }
  });


  router.post('/zcommand.invite', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { duration, users } } = req;
    if (!duration) {
      return res.status(400).send('Missing required body parameter "duration"');
    }
    if (typeof duration !== 'number') {
      return res.status(400).send('Missing required body parameter "duration" with type number');
    }

    if (!users) {
      return res.status(400).send('Missing required body parameter "users"');
    }
    if (!Array.isArray(users)) {
      return res.status(400).send('Missing required body parameter "users" with type Array');
    }

    try {
      const response = await zrcs.zcommand.invite({ duration, users });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.invite');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.invite');
    }
  });


  router.post('/zcommand.phonebook.list', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { offset, limit } } = req;
    if (typeof offset !== 'undefined' && typeof offset !== 'number') {
      return res.status(400).send('Missing optional body parameter "offset" with type number');
    }
    if (typeof limit !== 'undefined' && typeof limit !== 'number') {
      return res.status(400).send('Missing optional body parameter "limit" with type number');
    }
    try {
      const response = await zrcs.zcommand.phonebook.list({ offset, limit });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.phonebook.list');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.phonebook.list');
    }
  });


  router.post('/zcommand.run', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { file } } = req;
    if (!file) {
      return res.status(400).send('Missing required body parameter "file"');
    }
    if (typeof file !== 'string') {
      return res.status(400).send('Missing required body parameter "file" with type string');
    }
    try {
      const response = await zrcs.zcommand.run({ file });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.run');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.run');
    }
  });


  router.post('/zcommand.comment', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { text } } = req;
    if (!text) {
      return res.status(400).send('Missing required body parameter "text"');
    }
    if (typeof text !== 'string') {
      return res.status(400).send('Missing required body parameter "text" with type string');
    }
    try {
      const response = await zrcs.zcommand.comment({ text });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.comment');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.comment');
    }
  });


  router.post('/zcommand.wait', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { sec } } = req;
    if (!sec) {
      return res.status(400).send('Missing required body parameter "sec"');
    }
    if (typeof sec !== 'number') {
      return res.status(400).send('Missing required body parameter "sec" with type number');
    }
    try {
      const response = await zrcs.zcommand.wait({ sec });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.wait');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.wait');
    }
  });


  router.post('/zcommand.call.leave', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zcommand.call.leave();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.leave');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.leave');
    }
  });


  router.post('/zcommand.call.invite', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { user, users } } = req;
    if (!user) {
      return res.status(400).send('Missing required body parameter "user"');
    }
    if (typeof user !== 'string') {
      return res.status(400).send('Missing required body parameter "user" with type string');
    }
    if (!users) {
      return res.status(400).send('Missing required body parameter "users"');
    }
    if (!Array.isArray(users)) {
      return res.status(400).send('Missing required body parameter "users" with type Array');
    }
    try {
      const response = await zrcs.zcommand.call.invite({ user, users });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.invite');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.invite');
    }
  });


  router.post('/zcommand.call.inviteH323Room', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { address, cancel } } = req;
    if (!cancel) {
      return res.status(400).send('Missing required body parameter "cancel"');
    }
    if (cancel !== 'on' && cancel !== 'off') {
      return res.status(400).send('Missing required body parameter "cancel" with value "on" or "off"');
    }
    if (!address) {
      return res.status(400).send('Missing required body parameter "address"');
    }
    if (typeof address !== 'string') {
      return res.status(400).send('Missing required body parameter "address" with type string');
    }
    try {
      const response = await zrcs.zcommand.call.inviteH323Room({ address, cancel });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.inviteH323Room');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.inviteH323Room');
    }
  });


  router.post('/zcommand.call.inviteSIPRoom', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { address, cancel } } = req;
    if (!cancel) {
      return res.status(400).send('Missing required body parameter "cancel"');
    }
    if (cancel !== 'on' && cancel !== 'off') {
      return res.status(400).send('Missing required body parameter "cancel" with value "on" or "off"');
    }
    if (!address) {
      return res.status(400).send('Missing required body parameter "address"');
    }
    if (typeof address !== 'string') {
      return res.status(400).send('Missing required body parameter "address" with type string');
    }
    try {
      const response = await zrcs.zcommand.call.inviteSIPRoom({ address, cancel });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.inviteSIPRoom');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.inviteSIPRoom');
    }
  });


  router.post('/zcommand.call.muteParticipantVideo', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { mute, id } } = req;
    if (typeof mute !== 'boolean') {
      return res.status(400).send('Missing required body parameter "mute" with type boolean');
    }
    if (!id) {
      return res.status(400).send('Missing required body parameter "id"');
    }
    if (typeof id !== 'number') {
      return res.status(400).send('Missing required body parameter "id" with type number');
    }
    try {
      const response = await zrcs.zcommand.call.muteParticipantVideo({ mute, id });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.muteParticipantVideo');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.muteParticipantVideo');
    }
  });


  router.post('/zcommand.bookings.update', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zcommand.bookings.update();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.bookings.update');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.bookings.update');
    }
  });


  router.post('/zcommand.dial.sharing', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { duration, displayState, password } } = req;
    if (typeof password !== 'string') {
      return res.status(400).send('Missing required body parameter "password" with type string');
    }
    if (!duration) {
      return res.status(400).send('Missing required body parameter "duration"');
    }
    if (typeof duration !== 'number') {
      return res.status(400).send('Missing required body parameter "duration" with type number');
    }
    if (!displayState) {
      return res.status(400).send('Missing required body parameter "duration"');
    }
    if (displayState !== 'None' && displayState !== 'Laptop' && displayState !== 'IOS') {
      return res.status(400).send('Missing required body parameter "duration" with value "None", "Laptop" or "IOS"');
    }
    try {
      const response = await zrcs.zcommand.dial.sharing({ duration, displayState, password });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.dial.sharing');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.dial.sharing');
    }
  });


  router.post('/zcommand.call.shareCamera', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { id, status } } = req;
    if (!status) {
      return res.status(400).send('Missing required body parameter "status"');
    }
    if (status !== 'on' && status !== 'off') {
      return res.status(400).send('Missing required body parameter "status" with value "on" or "off"');
    }
    if (!id) {
      return res.status(400).send('Missing required body parameter "id"');
    }
    if (typeof id !== 'string') {
      return res.status(400).send('Missing required body parameter "id" with type string');
    }
    try {
      const response = await zrcs.zcommand.call.shareCamera({ id, status });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.shareCamera');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.shareCamera');
    }
  });


  router.post('/zcommand.call.setInstructions', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { show, type } } = req;
    if (!show) {
      return res.status(400).send('Missing required body parameter "show"');
    }
    if (show !== 'on' && show !== 'off') {
      return res.status(400).send('Missing required body parameter "show" with value "on" or "off"');
    }
    if (!type) {
      return res.status(400).send('Missing required body parameter "duration"');
    }
    if (type !== 'None' && type !== 'Laptop' && type !== 'IOS') {
      return res.status(400).send('Missing required body parameter "type" with value "None", "Laptop" or "IOS"');
    }
    try {
      const response = await zrcs.zcommand.call.setInstructions({ show, type });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.setInstructions');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.setInstructions');
    }
  });


  router.post('/zcommand.call.sharing.toNormal', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zcommand.call.sharing.toNormal();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.sharing.toNormal');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.sharing.toNormal');
    }
  });


  router.post('/zcommand.call.sharing.disconnect', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zcommand.call.sharing.disconnect();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.sharing.disconnect');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.sharing.disconnect');
    }
  });


  router.post('/zcommand.call.sharing.hdmi.start', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zcommand.call.sharing.hdmi.start();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.sharing.hdmi.start');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.sharing.hdmi.start');
    }
  });


  router.post('/zcommand.call.sharing.hdmi.stop', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zcommand.call.sharing.hdmi.stop();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.sharing.hdmi.stop');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.sharing.hdmi.stop');
    }
  });


  router.post('/zcommand.call.layout.turnPage', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { forward } } = req;
    if (typeof forward !== 'boolean') {
      return res.status(400).send('Missing required body parameter "forward" with type boolean');
    }
    try {
      const response = await zrcs.zcommand.call.layout.turnPage({ forward });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.layout.turnPage');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.layout.turnPage');
    }
  });


  router.post('/zcommand.call.expel', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { id } } = req;
    if (!id) {
      return res.status(400).send('Missing required body parameter "id"');
    }
    if (typeof id !== 'number') {
      return res.status(400).send('Missing required body parameter "id" with type number');
    }
    try {
      const response = await zrcs.zcommand.call.expel({ id });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.expel');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.expel');
    }
  });


  router.post('/zcommand.test.microphone.start', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { id } } = req;
    if (!id) {
      return res.status(400).send('Missing required body parameter "id"');
    }
    if (typeof id !== 'string') {
      return res.status(400).send('Missing required body parameter "id" with type string');
    }
    try {
      const response = await zrcs.zcommand.test.microphone.start({ id });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.test.microphone.start');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.test.microphone.start');
    }
  });


  router.post('/zcommand.test.microphone.stop', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zcommand.test.microphone.stop();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.test.microphone.stop');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.test.microphone.stop');
    }
  });


  router.post('/zcommand.test.speaker.start', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { id } } = req;
    if (!id) {
      return res.status(400).send('Missing required body parameter "id"');
    }
    if (typeof id !== 'string') {
      return res.status(400).send('Missing required body parameter "id" with type string');
    }
    try {
      const response = await zrcs.zcommand.test.speaker.start({ id });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.test.speaker.start');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.test.speaker.start');
    }
  });


  router.post('/zcommand.test.speaker.stop', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zcommand.test.speaker.stop();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.test.speaker.stop');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.test.speaker.stop');
    }
  });


  router.post('/zcommand.call.hostChange', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { id } } = req;
    if (!id) {
      return res.status(400).send('Missing required body parameter "id"');
    }
    if (typeof id !== 'number') {
      return res.status(400).send('Missing required body parameter "id" with type number');
    }
    try {
      const response = await zrcs.zcommand.call.hostChange({ id });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.hostChange');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.hostChange');
    }
  });


  router.post('/zcommand.call.hostClaim', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { key } } = req;
    if (!key) {
      return res.status(400).send('Missing required body parameter "key"');
    }
    if (typeof key !== 'number') {
      return res.status(400).send('Missing required body parameter "key" with type number');
    }
    try {
      const response = await zrcs.zcommand.call.hostClaim({ key });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.hostClaim');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.hostClaim');
    }
  });


  router.post('/zcommand.call.record', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { enable } } = req;
    if (!enable) {
      return res.status(400).send('Missing required body parameter "enable"');
    }
    if (enable !== 'on' && enable !== 'off') {
      return res.status(400).send('Missing required body parameter "enable" with value "on" or "off"');
    }
    try {
      const response = await zrcs.zcommand.call.record({ enable });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.record');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.record');
    }
  });


  router.post('/zcommand.call.spotlight', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { id, enable } } = req;
    if (!enable) {
      return res.status(400).send('Missing required body parameter "enable"');
    }
    if (enable !== 'on' && enable !== 'off') {
      return res.status(400).send('Missing required body parameter "enable" with value "on" or "off"');
    }
    if (!id) {
      return res.status(400).send('Missing required body parameter "id"');
    }
    if (typeof id !== 'number') {
      return res.status(400).send('Missing required body parameter "id" with type number');
    }
    try {
      const response = await zrcs.zcommand.call.spotlight({ id, enable });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.spotlight');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.spotlight');
    }
  });


  router.post('/zcommand.call.allowRecord', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { id, enable } } = req;
    if (!enable) {
      return res.status(400).send('Missing required body parameter "enable"');
    }
    if (enable !== 'on' && enable !== 'off') {
      return res.status(400).send('Missing required body parameter "enable" with value "on" or "off"');
    }
    if (!id) {
      return res.status(400).send('Missing required body parameter "id"');
    }
    if (typeof id !== 'number') {
      return res.status(400).send('Missing required body parameter "id" with type number');
    }
    try {
      const response = await zrcs.zcommand.call.allowRecord({ id, enable });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.allowRecord');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.allowRecord');
    }
  });


  router.post('/zcommand.call.cameraControl', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { id, speed, state, action } } = req;
    if (!id) {
      return res.status(400).send('Missing required body parameter "id"');
    }
    if (typeof id !== 'number') {
      return res.status(400).send('Missing required body parameter "id" with type number');
    }
    if (speed && typeof speed !== 'number') {
      return res.status(400).send('Missing optional body parameter "speed" with type number');
    }
    if (state && state !== 'Start' && state !== 'Continue' && state !== 'Stop' && state !== 'RequestRemote' && state !== 'GiveupRemote' && state !== 'RequestedByFarEnd') {
      return res.status(400).send('Missing optional body parameter "state" with value "Start" or "Continue" or "Stop" or "RequestRemote" or "GiveupRemote" or "RequestedByFarEnd"');
    }
    if (action && action !== 'Left' && action !== 'Right' && action !== 'Up' && action !== 'Down' && action !== 'In' && action !== 'Out') {
      return res.status(400).send('Missing optional body parameter "action" with value "Left" or "Right" or "Up" or "Down" or "In" or "Out"');
    }
    try {
      const response = await zrcs.zcommand.call.cameraControl({ id, speed, state, action });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.call.cameraControl');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.call.cameraControl');
    }
  });


  router.post('/zcommand.dial.checkin', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { meetingNumber } } = req;
    if (!meetingNumber) {
      return res.status(400).send('Missing required body parameter "meetingNumber"');
    }
    if (typeof meetingNumber !== 'string') {
      return res.status(400).send('Missing required body parameter "meetingNumber" with type string');
    }
    try {
      const response = await zrcs.zcommand.dial.checkin({ meetingNumber });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.dial.checkin');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.dial.checkin');
    }
  });


  router.post('/zcommand.schedule.add', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { meetingName, start, end, private: priv } } = req;
    if (!meetingName) {
      return res.status(400).send('Missing required body parameter "meetingName"');
    }
    if (typeof meetingName !== 'string') {
      return res.status(400).send('Missing required body parameter "meetingName" with type string');
    }
    if (!start) {
      return res.status(400).send('Missing required body parameter "start"');
    }
    if (typeof start !== 'string') {
      return res.status(400).send('Missing required body parameter "start" with type string');
    }
    if (!priv) {
      return res.status(400).send('Missing required body parameter "private"');
    }
    if (priv !== 'on' && priv !== 'off') {
      return res.status(400).send('Missing required body parameter "private" with value "on" or "off"');
    }
    if (!end) {
      return res.status(400).send('Missing required body parameter "end"');
    }
    if (typeof end !== 'string') {
      return res.status(400).send('Missing required body parameter "end" with type string');
    }
    try {
      const response = await zrcs.zcommand.schedule.add({ meetingName, start, end, private: priv });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.schedule.add');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.schedule.add');
    }
  });


  router.post('/zcommand.schedule.delete', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { meetingNumber } } = req;
    if (!meetingNumber) {
      return res.status(400).send('Missing required body parameter "meetingNumber"');
    }
    if (typeof meetingNumber !== 'string') {
      return res.status(400).send('Missing required body parameter "meetingNumber" with type string');
    }
    try {
      const response = await zrcs.zcommand.schedule.delete({ meetingNumber });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.schedule.delete');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.schedule.delete');
    }
  });


  router.post('/zcommand.dial.phoneCallOut', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { number } } = req;
    if (!number) {
      return res.status(400).send('Missing required body parameter "number"');
    }
    if (typeof number !== 'string') {
      return res.status(400).send('Missing required body parameter "number" with type string');
    }
    try {
      const response = await zrcs.zcommand.dial.phoneCallOut({ number });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.dial.phoneCallOut');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.dial.phoneCallOut');
    }
  });


  router.post('/zcommand.dial.phoneHangUp', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { callID } } = req;
    if (!callID) {
      return res.status(400).send('Missing required body parameter "callID"');
    }
    if (typeof callID !== 'string') {
      return res.status(400).send('Missing required body parameter "callID" with type string');
    }
    try {
      const response = await zrcs.zcommand.dial.phoneHangUp({ callID });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.dial.phoneHangUp');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.dial.phoneHangUp');
    }
  });


  router.post('/zcommand.phonecall.list', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zcommand.phonecall.list();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zcommand.phonecall.list');
      logger.errorStack(error);
      return res.status(400).send('Error for command zcommand.phonecall.list');
    }
  });


  router.post('/zconfiguration.call.sharing', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { optimize_video_sharing } } = req;
    if (!optimize_video_sharing) {
      return res.status(400).send('Missing required body parameter "optimize_video_sharing"');
    }
    if (optimize_video_sharing !== 'on' && optimize_video_sharing !== 'off') {
      return res.status(400).send('Missing required body parameter "optimize_video_sharing" with value "on" or "off"');
    }
    try {
      const response = await zrcs.zconfiguration.call.sharing({ optimize_video_sharing });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.call.sharing');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.call.sharing');
    }
  });


  router.post('/zconfiguration.call.sharing.optimize_video_sharing', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zconfiguration.call.sharing.optimize_video_sharing();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.call.sharing.optimize_video_sharing');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.call.sharing.optimize_video_sharing');
    }
  });


  router.post('/zconfiguration.call.microphone', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { mute } } = req;
    if (!mute) {
      return res.status(400).send('Missing required body parameter "mute"');
    }
    if (mute !== 'on' && mute !== 'off') {
      return res.status(400).send('Missing required body parameter "mute" with value "on" or "off"');
    }
    try {
      const response = await zrcs.zconfiguration.call.microphone({ mute });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.call.microphone');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.call.microphone');
    }
  });


  router.post('/zconfiguration.call.microphone.mute', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zconfiguration.call.microphone.mute();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.call.microphone.mute');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.call.microphone.mute');
    }
  });


  router.post('/zconfiguration.call.camera', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { mute } } = req;
    if (!mute) {
      return res.status(400).send('Missing required body parameter "mute"');
    }
    if (mute !== 'on' && mute !== 'off') {
      return res.status(400).send('Missing required body parameter "mute" with value "on" or "off"');
    }
    try {
      const response = await zrcs.zconfiguration.call.camera({ mute });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.call.camera');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.call.camera');
    }
  });


  router.post('/zconfiguration.audio.input', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { selectedID } } = req;
    if (!selectedID) {
      return res.status(400).send('Missing required body parameter "selectedID"');
    }
    if (typeof selectedID !== 'string') {
      return res.status(400).send('Missing required body parameter "selectedID" with type string');
    }
    try {
      const response = await zrcs.zconfiguration.audio.input({ selectedID });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.audio.input');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.audio.input');
    }
  });


  router.post('/zconfiguration.audio.input', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { is_sap_disabled } } = req;
    if (!is_sap_disabled) {
      return res.status(400).send('Missing required body parameter "is_sap_disabled"');
    }
    if (is_sap_disabled !== 'on' && is_sap_disabled !== 'off') {
      return res.status(400).send('Missing required body parameter "is_sap_disabled" with value "on" or "off"');
    }
    try {
      const response = await zrcs.zconfiguration.audio.input({ is_sap_disabled });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.audio.input');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.audio.input');
    }
  });


  router.post('/zconfiguration.audio.input', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { reduce_reverb } } = req;
    if (!reduce_reverb) {
      return res.status(400).send('Missing required body parameter "reduce_reverb"');
    }
    if (reduce_reverb !== 'on' && reduce_reverb !== 'off') {
      return res.status(400).send('Missing required body parameter "reduce_reverb" with value "on" or "off"');
    }
    try {
      const response = await zrcs.zconfiguration.audio.input({ reduce_reverb });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.audio.input');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.audio.input');
    }
  });


  router.post('/zconfiguration.audio.input', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { volume } } = req;
    if (!volume) {
      return res.status(400).send('Missing required body parameter "volume"');
    }
    if (typeof volume !== 'number') {
      return res.status(400).send('Missing required body parameter "volume" with type number');
    }
    try {
      const response = await zrcs.zconfiguration.audio.input({ volume });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.audio.input');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.audio.input');
    }
  });


  router.post('/zconfiguration.audio.output', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { selectedID } } = req;
    if (!selectedID) {
      return res.status(400).send('Missing required body parameter "selectedID"');
    }
    if (typeof selectedID !== 'string') {
      return res.status(400).send('Missing required body parameter "selectedID" with type string');
    }
    try {
      const response = await zrcs.zconfiguration.audio.output({ selectedID });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.audio.output');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.audio.output');
    }
  });


  router.post('/zconfiguration.audio.output', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { volume } } = req;
    if (!volume) {
      return res.status(400).send('Missing required body parameter "volume"');
    }
    if (typeof volume !== 'number') {
      return res.status(400).send('Missing required body parameter "volume" with type number');
    }
    try {
      const response = await zrcs.zconfiguration.audio.output({ volume });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.audio.output');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.audio.output');
    }
  });


  router.post('/zconfiguration.video', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { hide_conf_self_video } } = req;
    if (!hide_conf_self_video) {
      return res.status(400).send('Missing required body parameter "hide_conf_self_video"');
    }
    if (hide_conf_self_video !== 'on' && hide_conf_self_video !== 'off') {
      return res.status(400).send('Missing required body parameter "hide_conf_self_video" with value "on" or "off"');
    }
    try {
      const response = await zrcs.zconfiguration.video({ hide_conf_self_video });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.video');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.video');
    }
  });


  router.post('/zconfiguration.video.camera', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { selectedID } } = req;
    if (!selectedID) {
      return res.status(400).send('Missing required body parameter "selectedID"');
    }
    if (typeof selectedID !== 'string') {
      return res.status(400).send('Missing required body parameter "selectedID" with type string');
    }
    try {
      const response = await zrcs.zconfiguration.video.camera({ selectedID });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.video.camera');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.video.camera');
    }
  });


  router.post('/zconfiguration.video.camera', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { mirror } } = req;
    if (!mirror) {
      return res.status(400).send('Missing required body parameter "mirror"');
    }
    if (mirror !== 'on' && mirror !== 'off') {
      return res.status(400).send('Missing required body parameter "mirror" with value "on" or "off"');
    }
    try {
      const response = await zrcs.zconfiguration.video.camera({ mirror });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.video.camera');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.video.camera');
    }
  });


  router.post('/zconfiguration.client', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { appVersion } } = req;
    if (!appVersion) {
      return res.status(400).send('Missing required body parameter "appVersion"');
    }
    if (typeof appVersion !== 'string') {
      return res.status(400).send('Missing required body parameter "appVersion" with type string');
    }
    try {
      const response = await zrcs.zconfiguration.client({ appVersion });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.client');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.client');
    }
  });


  router.post('/zconfiguration.client', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { deviceSystem } } = req;
    if (!deviceSystem) {
      return res.status(400).send('Missing required body parameter "deviceSystem"');
    }
    if (typeof deviceSystem !== 'string') {
      return res.status(400).send('Missing required body parameter "deviceSystem" with type string');
    }
    try {
      const response = await zrcs.zconfiguration.client({ deviceSystem });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.client');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.client');
    }
  });


  router.post('/zconfiguration.call.layout', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { shareThumb, style, size, position } } = req;
    if (shareThumb && shareThumb !== 'on' && shareThumb !== 'off') {
      return res.status(400).send('Missing optional body parameter "shareThumb" with value "on" or "off"');
    }
    if (style && style !== 'Gallery' && style !== 'Speaker' && style !== 'Strip' && style !== 'ShareAll') {
      return res.status(400).send('Missing optional body parameter "style" with value "Gallery" or "Speaker" or "Strip" or "ShareAll"');
    }
    if (size && size !== 'Off' && size !== 'Size1' && size !== 'Size2' && size !== 'Size3' && size !== 'Strip') {
      return res.status(400).send('Missing optional body parameter "size" with value "Off" or "Size1" or "Size2" or "Size3" or "Strip"');
    }

    if (position !== 'Center' && position !== 'Up' && position !== 'Right' && position !== 'UpRight' && position !== 'Down' && position !== 'DownRight' && position !== 'Left' && position !== 'UpLeft' && position !== 'DownLeft') {
      return res.status(400).send('Missing required body parameter "position" with value "Center" or "Up" or "Right" or "UpRight" or "Down" or "DownRight" or "Left" or "UpLeft" or "DownLeft"');
    }
    try {
      const response = await zrcs.zconfiguration.call.layout({ shareThumb, style, size, position });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.call.layout');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.call.layout');
    }
  });


  router.post('/zconfiguration.call.lock', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { enable } } = req;
    if (typeof enable !== 'boolean') {
      return res.status(400).send('Missing required body parameter "enable" with type boolean');
    }
    try {
      const response = await zrcs.zconfiguration.call.lock({ enable });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.call.lock');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.call.lock');
    }
  });


  router.post('/zconfiguration.call.muteUserOnEntry', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { enable } } = req;
    if (typeof enable !== 'boolean') {
      return res.status(400).send('Missing required body parameter "enable" with type boolean');
    }
    try {
      const response = await zrcs.zconfiguration.call.muteUserOnEntry({ enable });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.call.muteUserOnEntry');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.call.muteUserOnEntry');
    }
  });


  router.post('/zconfiguration.call.closedCaption', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }
    const { body: { visible, fontSize } } = req;
    if (typeof visible !== 'boolean' && typeof visible !== 'undefined') {
      return res.status(400).send('Missing optional body parameter "visible" with type boolean');
    }
    if (typeof fontSize !== 'undefined' && fontSize !== 0 && fontSize !== 1 && fontSize !== 2) {
      return res.status(400).send('Missing optional body parameter "fontSize" with value 0 or 1 or 2');
    }
    try {
      const response = await zrcs.zconfiguration.call.closedCaption({ visible, fontSize });
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zconfiguration.call.closedCaption');
      logger.errorStack(error);
      return res.status(400).send('Error for command zconfiguration.call.closedCaption');
    }
  });


  router.post('/zstatus.call.status', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zstatus.call.status();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zstatus.call.status');
      logger.errorStack(error);
      return res.status(400).send('Error for command zstatus.call.status');
    }
  });


  router.post('/zstatus.audio.input.line', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zstatus.audio.input.line();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zstatus.audio.input.line');
      logger.errorStack(error);
      return res.status(400).send('Error for command zstatus.audio.input.line');
    }
  });


  router.post('/zstatus.audio.output.line', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zstatus.audio.output.line();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zstatus.audio.output.line');
      logger.errorStack(error);
      return res.status(400).send('Error for command zstatus.audio.output.line');
    }
  });


  router.post('/zstatus.video.camera.line', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zstatus.video.camera.line();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zstatus.video.camera.line');
      logger.errorStack(error);
      return res.status(400).send('Error for command zstatus.video.camera.line');
    }
  });


  router.post('/zstatus.video.optimizable', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zstatus.video.optimizable();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zstatus.video.optimizable');
      logger.errorStack(error);
      return res.status(400).send('Error for command zstatus.video.optimizable');
    }
  });


  router.post('/zstatus.systemUnit', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zstatus.systemUnit();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zstatus.systemUnit');
      logger.errorStack(error);
      return res.status(400).send('Error for command zstatus.systemUnit');
    }
  });


  router.post('/zstatus.capabilities', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zstatus.capabilities();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zstatus.capabilities');
      logger.errorStack(error);
      return res.status(400).send('Error for command zstatus.capabilities');
    }
  });


  router.post('/zstatus.sharing', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zstatus.sharing();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zstatus.sharing');
      logger.errorStack(error);
      return res.status(400).send('Error for command zstatus.sharing');
    }
  });


  router.post('/zstatus.cameraShare', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zstatus.cameraShare();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zstatus.cameraShare');
      logger.errorStack(error);
      return res.status(400).send('Error for command zstatus.cameraShare');
    }
  });


  router.post('/zstatus.call.layout', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zstatus.call.layout();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zstatus.call.layout');
      logger.errorStack(error);
      return res.status(400).send('Error for command zstatus.call.layout');
    }
  });


  router.post('/zstatus.call.closedCaption.available', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zstatus.call.closedCaption.available();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zstatus.call.closedCaption.available');
      logger.errorStack(error);
      return res.status(400).send('Error for command zstatus.call.closedCaption.available');
    }
  });


  router.post('/zstatus.numberOfScreens', async (req: express$Request, res: express$Response) => {
    if (!zrcs) {
      return res.status(400).send('Zoom Room Control System is not connected');
    }

    try {
      const response = await zrcs.zstatus.numberOfScreens();
      return res.json(response);
    } catch (error) {
      logger.error('Error for command zstatus.numberOfScreens');
      logger.errorStack(error);
      return res.status(400).send('Error for command zstatus.numberOfScreens');
    }
  });


  active = true;

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
