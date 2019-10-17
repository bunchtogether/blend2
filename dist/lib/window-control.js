//      

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const findProcess = require('@bunchtogether/find-process');
const openDesktopWindowButton = require('@bunchtogether/desktop-window-button');
const { setForegroundWindow, keepOnTop } = require('@bunchtogether/picture-in-picture');
const { addShutdownHandler } = require('@bunchtogether/exit-handler');
const logger = require('./logger')('Window Control');


const buttonImageSrcPromise = (async () => {
  const basePath = path.resolve(__dirname, '../band.png');
  const basePathExists = await fs.exists(basePath);
  if (basePathExists) {
    return basePath;
  }
  const localPath = path.resolve(process.cwd(), 'band.png');
  const localPathExists = await fs.exists(localPath);
  if (localPathExists) {
    return localPath;
  }
  throw new Error('Unable to locate band png');
})();

let closeBandButton;

const getGoogleChromeName = () => {
  switch (os.platform()) {
    case 'win32':
      return 'chrome';
    case 'darwin':
      return 'Google Chrome';
    case 'linux':
      return 'chromium';
    default:
      return 'chrome';
  }
};

const maxTimeout = 5 * 60 * 1000; // 5 mins
const waitForChromeToSwitchToBand = async () => {
  try {
    let isChromeAvailable = false;
    const stopAt = Date.now() + maxTimeout;

    while (stopAt > Date.now()) {
      const processList = findProcess('name', getGoogleChromeName(), true);
      if (Array.isArray(processList) && processList.length > 0) {
        isChromeAvailable = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (isChromeAvailable) {
      await switchToBand();
    }
  } catch (error) {
    logger.error(`Failed to lookup chrome process, Error: ${error.message}`);
  }
};

const switchToBand = async () => {
  if (closeBandButton) {
    closeBandButton();
    closeBandButton = null;
  }
  logger.info('Activating Chrome Window');
  try {
    await keepOnTop('chrome', true);
  } catch (error) {
    logger.error(`Failed to activate Chrome window: ${error.message}`);
  }
};

const switchToApp = async (pathname        , buttonX        , buttonY        , className        ) => {
  if (closeBandButton) {
    closeBandButton();
    closeBandButton = null;
  }
  logger.info(`Activating "${pathname}" Window${className ? ` with "${className}" Class` : ''}`);
  try {
    await keepOnTop('chrome', false);
    await setForegroundWindow(pathname, className);
  } catch (error) {
    logger.error(`Failed to activate "${pathname}" window: ${error.message}`);
  }
  if (typeof buttonX === 'number' && typeof buttonY === 'number') {
    const buttonImageSrc = await buttonImageSrcPromise;
    closeBandButton = await openDesktopWindowButton(buttonImageSrc, buttonX, buttonY, switchToBand, 'top right');
  }
};

addShutdownHandler(async () => {
  await keepOnTop('chrome', false);
}, (error      ) => {
  logger.error('Unable to move Chrome from top');
  logger.errorStack(error);
});


module.exports = {
  waitForChromeToSwitchToBand,
  switchToBand,
  switchToApp,
};
