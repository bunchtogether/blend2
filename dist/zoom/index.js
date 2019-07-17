//      

const bringApplicationToFront = require('@bunchtogether/bring-application-to-front');
const ZoomRoomsControlSystem = require('@bunchtogether/zoom-rooms-control-system');
const logger = require('../lib/logger')('Zoom Control');

let activeRoom;

async function connect(password         ) {
  await disconnect();
  const zoom = new ZoomRoomsControlSystem('127.0.0.1', password || '');
  await zoom.connect();
  activeRoom = zoom;
  return zoom;
}

async function disconnect() {
  if (activeRoom) {
    await activeRoom.disconnect();
  }
  activeRoom = null;
}

async function joinMeeting(meetingNumber        , password         ) {
  logger.info(`Joining meeting ${meetingNumber}`);
  const zoom = await connect(password);
  await zoom.zcommand.dial.join({ meetingNumber });
  await bringApplicationToFront('ZoomRooms');
}

async function leaveMeeting() {
  logger.info('Leaving meeting');
  await bringApplicationToFront('chrome');
  if (activeRoom) {
    await activeRoom.zcommand.call.leave();
    await disconnect();
  }
}

module.exports = {
  joinMeeting,
  leaveMeeting,
};
