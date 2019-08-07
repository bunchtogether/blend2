//      

const path = require('path');
const openDesktopWindowButton = require('@bunchtogether/desktop-window-button');

const bandSrc = path.resolve(__dirname, '../band.png');
let closeBandButton;

const showBandButton = (onClick          , x         = 20, y         = 20) => {
  hideBandButton();
  closeBandButton = openDesktopWindowButton(bandSrc, x, y, onClick || (() => {}));
};

const hideBandButton = () => {
  if (closeBandButton) {
    closeBandButton();
  }
  closeBandButton = null;
};

module.exports = {
  showBandButton,
  hideBandButton,
};
