//      

const bringApplicationToFront = require('@bunchtogether/bring-application-to-front');
const ZoomRoomsControlSystem = require('@bunchtogether/zoom-rooms-control-system');
const logger = require('../lib/logger')('Zoom Control');

let activeZoom;

async function connect(passcode         ) {
  await disconnect();
  const zoom = new ZoomRoomsControlSystem('127.0.0.1', passcode || '');
  await zoom.connect();
  activeZoom = zoom;
  zoom.on('error', (error) => {
    logger.error('Zoom Rooms Control System error');
    logger.errorStack(error);
  });
  return zoom;
}

async function disconnect() {
  try {
    if (activeZoom) {
      await activeZoom.disconnect();
    }
  } finally {
    activeZoom = null;
  }
}

async function joinMeeting(meetingNumber        , passcode         ) {
  logger.info(`Joining meeting ${meetingNumber}`);
  await bringApplicationToFront('ZoomRooms.exe');
  const zoom = await connect(passcode);
  await zoom.zcommand.dial.start({ meetingNumber });
}

let leaveMeetingPromise;
async function leaveMeeting() {
  logger.info('Leaving meeting');
  if (leaveMeetingPromise) {
    return leaveMeetingPromise;
  }
  leaveMeetingPromise = new Promise(async (resolve, reject) => {
    try {
      if (activeZoom) {
        await activeZoom.zcommand.call.leave();
        await disconnect();
      }
      resolve();
    } catch (error) {
      reject(error);
    } finally {
      bringApplicationToFront('chrome.exe').catch((error) => (
        logger.error(`Failed to bring chrome to front, ${error.message}`)
      ));
      leaveMeetingPromise = null;
    }
  });
  return leaveMeetingPromise;
}

async function phoneCallOut(number        , passcode         ) {
  let zoom = activeZoom;
  if (!zoom) {
    zoom = await connect(passcode);
  }
  await zoom.zcommand.dial.phoneCallOut({ number });
  await bringApplicationToFront('ZoomRooms.exe');
}

async function listParticipants() {
  if (activeZoom) {
    const participants = await activeZoom.zcommand.call.listParticipants();
    return participants;
  }
  return null;
}

async function setVolume(volume        ) {
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
  listParticipants,
  phoneCallOut,
  connect,
  disconnect,
};
