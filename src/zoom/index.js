// @flow

const bringApplicationToFront = require('@bunchtogether/bring-application-to-front');
const ZoomRoomsControlSystem = require('@bunchtogether/zoom-rooms-control-system');
const logger = require('../lib/logger')('Zoom Control');

let activeZoom;

async function connect(password?: string) {
  await disconnect();
  const zoom = new ZoomRoomsControlSystem('127.0.0.1', password || '');
  await zoom.connect();
  activeZoom = zoom;
  zoom.on('error', (error) => {
    logger.error('Zoom Rooms Control System error');
    logger.errorStack(error);
  });
  return zoom;
}

async function disconnect() {
  if (activeZoom) {
    await activeZoom.disconnect();
  }
  activeZoom = null;
}

async function joinMeeting(meetingNumber: string, password?: string) {
  logger.info(`Joining meeting ${meetingNumber}`);
  await bringApplicationToFront('ZoomRooms.exe');
  const zoom = await connect(password);
  await zoom.zcommand.dial.join({ meetingNumber });
}

async function leaveMeeting() {
  logger.info('Leaving meeting');
  await bringApplicationToFront('chrome.exe');
  if (activeZoom) {
    await activeZoom.zcommand.call.leave();
    await disconnect();
  }
}

async function setVolume(volume: number) {
  logger.info(`Setting Zoom room volume to: ${volume}`);
  if (activeZoom) {
    await activeZoom.zconfiguration.audio.output({ volume });
  }
}

async function muteMic() {
  logger.info('Muting Zoom room microphone');
  if (activeZoom) {
    await activeZoom.zconfiguration.call.microphone({ mute: 'on' });
  }
}

async function unmuteMic() {
  logger.info('Un-muting Zoom room microphone');
  if (activeZoom) {
    await activeZoom.zconfiguration.call.microphone({ mute: 'off' });
  }
}

async function enableVideo() {
  logger.info('Enabling video for Zoom room');
  if (activeZoom) {
    await activeZoom.zconfiguration.call.camera({ mute: 'off' });
  }
}

async function disableVideo() {
  logger.info('Disabling video for Zoom room');
  if (activeZoom) {
    await activeZoom.zconfiguration.call.camera({ mute: 'on' });
  }
}

module.exports = {
  joinMeeting,
  leaveMeeting,
  muteMic,
  unmuteMic,
  setVolume,
  enableVideo,
  disableVideo,
};
