//      

const os = require('os');
const logger = require('./logger')('Picture In Picture');

const platform = os.platform();

let setForegroundWindow = (name        ) => logger.warn(`setForegroundWindow is not available on ${platform}, ${name}`);
let createWindow = (name        ) => logger.warn(`createWindow is not available on ${platform}, ${name}`);

if (platform === 'win32') {
  const { showBandButton, hideBandButton } = require('./desktop-window-button'); // eslint-disable-line global-require
  const pictureInPicture = require('@bunchtogether/picture-in-picture'); // eslint-disable-line global-require
  setForegroundWindow = async (name        , disableButton          = false) => {
    console.log("setForegroundWindow", name);
    await pictureInPicture.setForegroundWindow(name);
    if (!disableButton) {
      if (name === 'chrome') {
        hideBandButton();
      } else {
        showBandButton(() => {
          setForegroundWindow('chrome')
        });
      }
    }
  };
  createWindow = pictureInPicture.createWindow;
}

module.exports = {
  setForegroundWindow,
  createWindow,
};
