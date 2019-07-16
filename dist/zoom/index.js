//      

const bringApplicationToFront = require('@bunchtogether/bring-application-to-front');
const ZoomRoomsControlSystem = require('../../vendor/zoom-rooms-control-system');

let activeRoom;

async function connect() {
  await disconnect();
  const zoom = new ZoomRoomsControlSystem('127.0.0.1', '0912');
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

async function joinMeeting(meetingNumber        ) {
  const zoom = await connect();
  await zoom.zCommand.dial.join({ meetingNumber });
  await bringApplicationToFront('Zoom');
}

async function leaveMeeting() {
  await disconnect();
  await zoom.zCommand.dial.leave();
  await bringApplicationToFront('Chrome');
}

module.exports = {
  joinMeeting,
  leaveMeeting,
};
