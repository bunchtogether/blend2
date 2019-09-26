//      

const path = require('path');
const fs = require('fs-extra');
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
  switchToBand,
  switchToApp,
};
