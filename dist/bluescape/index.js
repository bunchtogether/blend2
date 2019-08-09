//      

const find = require('find-process');
const { setForegroundWindow } = require('../lib/picture-in-picture');
const logger = require('../lib/logger')('Bluescape Control');
const { showBandButton } = require('../lib/desktop-window-button');

const resultPromise = find('name', 'tsx_winmaster', true).catch((error) => {
  logger.error('Error while finding process');
  logger.errorStack(error);
});

async function isAvailable() {
  const result = await resultPromise;
  return Array.isArray(result) && result.length > 0;
}

async function focus() {
  logger.info('Switching to Bluescape');
  await setForegroundWindow('tsx_winslave');
  await showBandButton(() => {
  	setForegroundWindow("chrome").catch((error) => {
  		logger.error("Could not set Foreground window");
  		logger.errorStack(error);
  	})
  });
}


module.exports = {
  isAvailable,
  focus,
};
