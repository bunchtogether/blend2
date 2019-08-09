//      

const find = require('find-process');
const { setForegroundWindow } = require('../lib/picture-in-picture');
const logger = require('../lib/logger')('Zoom Control');

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

const resultPromise = find('name', 'ZoomRooms', true).catch((error) => {
  logger.error('Error while finding process');
  logger.errorStack(error);
});

async function isAvailable() {
  const result = await resultPromise;
  return Array.isArray(result) && result.length > 0;
}

module.exports = {
  focusApplication,
  isAvailable,
};