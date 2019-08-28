// @flow

const path = require('path');
const openDesktopWindowButton = require('@bunchtogether/desktop-window-button');
const { setForegroundWindow } = require('@bunchtogether/picture-in-picture');
const logger = require('./logger')('Window Control');

const buttonImageSrc = path.resolve(__dirname, '../band.png');

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

const switchToApp = async (pathname: string, buttonX?:number, buttonY?:number) => {
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
    closeBandButton = await openDesktopWindowButton(buttonImageSrc, buttonX, buttonY, switchToBand, 'top right');
  }
  bandActive = false;
};

module.exports = {
  switchToBand,
  switchToApp,
};
