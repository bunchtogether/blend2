// @flow

const VizioAdapter = require('./vizio');
const { getDevice } = require('../models');
const constants = require('../constants');
const logger = require('../lib/logger')('Adapters');

const adapters = {
  [constants.TYPE_VIZIO]: VizioAdapter,
};

let activeAdapter = null;
let initPromise;

const _initAdapters = async () => { // eslint-disable-line no-underscore-dangle
  logger.info('Initializing adapters');
  try {
    const device = await getDevice();
    if (device && device.data && device.type) {
      const Adapter = adapters[device.type];
      const adapterInstance = new Adapter(device.data);
      activeAdapter = adapterInstance;
    }
  } catch (error) {
    logger.error('Failed to initialize adapter');
    logger.errorStack(error);
  }
};

const initAdapters = () => {
  if (!initPromise) {
    initPromise = _initAdapters();
  }
  return initPromise;
};

const setActiveAdapter = (adapter: Object) => {
  activeAdapter = adapter;
};

const getActiveAdapter = async () => {
  await initAdapters();
  return activeAdapter;
};

module.exports = {
  ...adapters,
  initAdapters,
  setActiveAdapter,
  getActiveAdapter,
};
