// @flow

const VizioAdapter = require('./vizio');
const SamsungAdapter = require('./samsung');
const constants = require('../constants');
const logger = require('../lib/logger')('Adapters');

const adapters = {
  [constants.TYPE_VIZIO]: VizioAdapter,
  [constants.TYPE_SAMSUNG]: SamsungAdapter,
};

let activeAdapter = null;
let initPromise;

const _initAdapter = async (levelDb:Object) => { // eslint-disable-line no-underscore-dangle
  logger.info('Initializing adapters');
  try {
    const device = await levelDb.get(constants.LEVEL_DB_DEVICE);
    if (device && device.data && device.type) {
      const Adapter = adapters[device.type];
      const adapterInstance = new Adapter({ ...device.data, ready: true }, device);
      activeAdapter = adapterInstance;
    }
  } catch (error) {
    logger.error('Failed to initialize adapter');
    logger.errorStack(error);
  }
};

const initAdapter = (levelDb:Object) => {
  if (!initPromise) {
    initPromise = _initAdapter(levelDb);
  }
  return initPromise;
};

const setActiveAdapter = async (adapter: Object) => {
  await closeAdapter();
  activeAdapter = adapter;
};

const getActiveAdapter = async () => activeAdapter;

const closeAdapter = async () => {
  if (activeAdapter && activeAdapter.close) {
    await activeAdapter.close();
  }
};

module.exports = {
  ...adapters,
  initAdapter,
  setActiveAdapter,
  getActiveAdapter,
  closeAdapter,
};
