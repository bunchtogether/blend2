//      

const VizioAdapter = require('./vizio');
const { getDevice } = require('../models');
const logger = require('../lib/logger')('Adapters');

const adapters = {
  vizio: VizioAdapter,
};

let activeAdapter = null;

const initAdapters = async () => {
  logger.info('Initializing adapters');
  const device = await getDevice();
  if (device && device.data && device.data.type) {
    const Adapter = adapters[device.data.type];
    const adapterInstance = new Adapter(device.data);
    activeAdapter = adapterInstance;
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
