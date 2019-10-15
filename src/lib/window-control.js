// @flow

const path = require('path');
const fs = require('fs-extra');
const psNode = require('ps-node');
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

const maxTimeout = 5 * 60 * 1000; // 5 mins
const waitForChromeToSwitchToBand = async () => {
  try {
    let isChromeAvailable = false;
    const stopAt = Date.now() + maxTimeout;

    while (stopAt > Date.now()) {
      isChromeAvailable = await new Promise(async (resolve, reject) => { // eslint-disable-line
        psNode.lookup({ command: 'chrome' }, (err, results) => {
          if (err) {
            logger.error(`Failed to query processes, Error: ${err.message}`);
            resolve(false);
          }
          if (Array.isArray(results) && results.length > 0) {
            resolve(true);
          }
          resolve(false);
        });
      });
      if (isChromeAvailable) {
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

const switchToApp = async (pathname: string, buttonX?:number, buttonY?:number, className?:string) => {
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
}, (error:Error) => {
  logger.error('Unable to move Chrome from top');
  logger.errorStack(error);
});


module.exports = {
  waitForChromeToSwitchToBand,
  switchToBand,
  switchToApp,
};
