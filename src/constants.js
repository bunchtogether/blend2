// @flow

const { BLEND_CONFIG, KIOSK_MODE, ENABLE_TRAY_ICON, BLEND_LOGS_DIR } = process.env;

if (!BLEND_LOGS_DIR) {
  throw new Error('Missing BLEND_LOGS_DIR flag, default logs path is not set');
}

module.exports.API_PORT = 61340;

module.exports.TYPE_VIZIO = 'vizio';
module.exports.TYPE_SAMSUNG = 'samsung';
module.exports.TYPE_NEC = 'nec';

module.exports.LEVEL_DB_DEVICE = 'DEVICE';

let configFile = 'config.json';
if (BLEND_CONFIG) {
  configFile = BLEND_CONFIG;
}

module.exports.CONFIG_FILE = configFile;

module.exports.KIOSK_MODE = KIOSK_MODE === 'true';

module.exports.ENABLE_TRAY_ICON = ENABLE_TRAY_ICON === 'true';

module.exports.BLEND_LOGS_DIR = BLEND_LOGS_DIR;
