// @flow

const os = require('os');
const logger = require('./logger')('Picture In Picture');

const platform = os.platform();

let setForegroundWindow = (name: string) => logger.warn(`setForegroundWindow is not available on ${platform}, ${name}`);
let createWindow = (name: string) => logger.warn(`createWindow is not available on ${platform}, ${name}`);

if (platform === 'win32') {
  const { showBandButton, hideBandButton } = require('./desktop-window-button'); // eslint-disable-line global-require
  const pictureInPicture = require('@bunchtogether/picture-in-picture'); // eslint-disable-line global-require
  setForegroundWindow = async (name: string, disableButton: boolean = false) => {
    await pictureInPicture.setForegroundWindow(name);
    if (!disableButton) {
      if (name === 'chrome') {
        hideBandButton();
      } else {
        showBandButton(() => setForegroundWindow('chrome'));
      }
    }
  };
  createWindow = pictureInPicture.createWindow;
}

module.exports = {
  setForegroundWindow,
  createWindow,
};
