//      

const { BLEND_CONFIG } = process.env;

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