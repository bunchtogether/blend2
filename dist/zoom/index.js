//      

const bringApplicationToFront = require('@bunchtogether/bring-application-to-front');

async function startRoom(hostname        , password         ) {
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
