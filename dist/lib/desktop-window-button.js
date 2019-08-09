//      

const path = require('path');
const os = require('os');
const openDesktopWindowButton = require('@bunchtogether/desktop-window-button');
const logger = require('./logger')('Desktop Window Button');

const platform = os.platform();

const bandSrc = path.resolve(__dirname, '../band.png');
let closeBandButton;

let showBandButton = (onClick          , x         , y         ) => logger.warn(`showBandButton is not available on ${platform}`); // eslint-disable-line no-unused-vars
let hideBandButton = () => logger.warn(`hideBandButton is not available on ${platform}`);

if (platform === 'win32') {
  showBandButton = async (onClick          , x          = 20, y          = 100) => {
    hideBandButton();
    closeBandButton = await openDesktopWindowButton(bandSrc, x, y, onClick || (() => {}), 'top right');
  };
  hideBandButton = () => {
    if (closeBandButton) {
      closeBandButton();
    }
    closeBandButton = null;
  };
}


module.exports = {
  showBandButton,
  hideBandButton,
};
