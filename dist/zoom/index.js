//      

const bringApplicationToFront = require('@bunchtogether/bring-application-to-front');
const ZoomRoomsControlSystem = require('@bunchtogether/zoom-rooms-control-system');
const logger = require('../lib/logger')('Zoom Control');

let activeZoom;

async function connect(password         ) {
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

async function joinMeeting(meetingNumber        , password         ) {
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

module.exports = {
  joinMeeting,
  leaveMeeting,
};
