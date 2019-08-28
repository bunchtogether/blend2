//      

const path = require('path');
const fs = require('fs-extra');
const openDesktopWindowButton = require('@bunchtogether/desktop-window-button');
const { setForegroundWindow } = require('@bunchtogether/picture-in-picture');
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
let bandActive = false;

const switchToBand = async () => {
  if (bandActive) {
    return;
  }
  if (closeBandButton) {
    closeBandButton();
    closeBandButton = null;
  }
  logger.info('Activating Chrome Window');
  try {
    await setForegroundWindow('chrome');
  } catch (error) {
    logger.error(`Failed to activate Chrome window: ${error.message}`);
  }
  bandActive = true;
};

const switchToApp = async (pathname        , buttonX        , buttonY        ) => {
  if (closeBandButton) {
    closeBandButton();
    closeBandButton = null;
  }
  logger.info(`Activating "${pathname}" Window`);
  try {
    await setForegroundWindow(pathname);
  } catch (error) {
    logger.error(`Failed to activate "${pathname}" window: ${error.message}`);
  }
  if (typeof buttonX === 'number' && typeof buttonY === 'number') {
    const buttonImageSrc = await buttonImageSrcPromise;
    closeBandButton = await openDesktopWindowButton(buttonImageSrc, buttonX, buttonY, switchToBand, 'top right');
  }
  bandActive = false;
};

module.exports = {
  switchToBand,
  switchToApp,
};
