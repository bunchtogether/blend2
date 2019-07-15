// @flow

const bringApplicationToFront = require('@bunchtogether/bring-application-to-front');

async function startRoom(hostname: string, password?: string) {
  console.log('START ROOM', hostname, password);
  await bringApplicationToFront('Zoom');
}

async function stopRoom() {
  await bringApplicationToFront('Chrome');
}

module.exports = {
  startRoom,
  stopRoom,
};
