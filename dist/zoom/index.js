//      

const ZoomRoomsControlSystem = require('@bunchtogether/zoom-rooms-control-system');
const { setForegroundWindow } = require('../lib/picture-in-picture');
const logger = require('../lib/logger')('Zoom Control');

let activeZoom;

function focusApplication(name        , tries         = 0) {
  setForegroundWindow(name).catch((error        ) => {
    if (tries < 3) {
      setTimeout(() => focusApplication(name, tries + 1), (tries + 1) * 1000);
    } else {
      logger.error(`Failed to set ${name} as foreground window, ${error.message}`);
      logger.errorStack(error);
    }
  });
}

function handleZoomEvents(key        ) {
  if (key === 'CallDisconnect') {
    focusApplication('chrome');
  }
}

async function connect(passcode         ) {
  await disconnect();
  const zoom = new ZoomRoomsControlSystem('127.0.0.1', passcode || '');
  zoom.on('zEvent', handleZoomEvents);
  await zoom.connect();
  activeZoom = zoom;
  return zoom;
}

async function disconnect() {
  const zoom = activeZoom;
  activeZoom = null;
  if (zoom) {
    await zoom.disconnect();
  }
}

async function joinMeeting(meetingNumber        , passcode         ) {
  logger.info(`Joining meeting ${meetingNumber}`);
  focusApplication('ZoomRooms');
  const zoom = await connect(passcode);
  await zoom.zcommand.dial.start({ meetingNumber });
}

async function leaveMeeting() {
  logger.info('Leaving meeting');
  focusApplication('chrome');
  if (activeZoom) {
    await activeZoom.zcommand.call.leave();
    await disconnect();
  }
}

async function phoneCallOut(number        , passcode         ) {
  logger.info(`Phone Call Out to ${number}`);
  focusApplication('ZoomRooms');
  let zoom = activeZoom;
  if (!zoom) {
    zoom = await connect(passcode);
  }
  await zoom.zcommand.dial.phoneCallOut({ number });
}

async function share(passcode         ) {
  logger.info('Share Content');
  focusApplication('ZoomRooms');
  let zoom = activeZoom;
  if (!zoom) {
    zoom = await connect(passcode);
  }
  await zoom.zcommand.dial.sharing({ duration: 60, displayState: 'Laptop' });
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
  share,
  connect,
  disconnect,
};
