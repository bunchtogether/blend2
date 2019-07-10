//      

const VizioAdapter = require('./vizio');
const SamsungAdapter = require('./samsung');
const { getDevice } = require('../models');
const constants = require('../constants');
const logger = require('../lib/logger')('Adapters');

const adapters = {
  [constants.TYPE_VIZIO]: VizioAdapter,
  [constants.TYPE_SAMSUNG]: SamsungAdapter,
};

let activeAdapter = null;
let initPromise;

const _initAdapters = async () => { // eslint-disable-line no-underscore-dangle
  logger.info('Initializing adapters');
  try {
    const device = await getDevice();
    if (device && device.data && device.type) {
      const Adapter = adapters[device.type];
      const adapterInstance = new Adapter({ ...device.data, ready: true });
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

const setActiveAdapter = async (adapter        ) => {
  if (activeAdapter && activeAdapter.close) {
    await activeAdapter.close();
  }
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
