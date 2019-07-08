//      

const VizioAdapter = require('./vizio');
const { getDevice } = require('../models');
const constants = require('../constants');
const logger = require('../lib/logger')('Adapters');

const adapters = {
  [constants.TYPE_VIZIO]: VizioAdapter,
};

let activeAdapter = null;

const initAdapters = async () => {
  logger.info('Initializing adapters');
  try {
    const device = await getDevice();
    if (device && device.data && device.data.type) {
      const Adapter = adapters[device.type];
      const adapterInstance = new Adapter(device.data);
      activeAdapter = adapterInstance;
    }
  } catch(error) {
    logger.error('Failed to initialize adapter');
    logger.errorStack(error);
  }
};

const setActiveAdapter = (adapter        ) => {
  activeAdapter = adapter;
};

const getActiveAdapter = () => activeAdapter;

module.exports = {
  ...adapters,
  initAdapters,
  setActiveAdapter,
  getActiveAdapter,
};
