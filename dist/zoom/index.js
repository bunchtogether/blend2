//      

const bringApplicationToFront = require('@bunchtogether/bring-application-to-front');
const ZoomRoomsControlSystem = require('@bunchtogether/zoom-rooms-control-system');
const logger = require('../lib/logger')('Zoom Control');

let activeZoom;

function focusApplication(name        , tries         = 0) {
  bringApplicationToFront(name).catch((error        ) => {
    if (tries < 3) {
      setTimeout(() => focusApplication(name, tries + 1), (tries + 1) * 1000);
    } else {
      logger.error(`Failed to bring ${name} to front, ${error.message}`);
      logger.errorStack(error);
    }
  });
}

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
  focusApplication('ZoomRooms.exe');
  const zoom = await connect(passcode);
  await zoom.zcommand.dial.start({ meetingNumber });
}

async function leaveMeeting() {
  logger.info('Leaving meeting');
  try {
    if (activeZoom) {
      await activeZoom.zcommand.call.leave();
      await disconnect();
    }
  } finally {
    focusApplication('chrome.exe');
  }
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
