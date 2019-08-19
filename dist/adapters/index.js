//      

const VizioAdapter = require('./vizio');
const SamsungAdapter = require('./samsung');
const NecAdapter = require('./nec');
const constants = require('../constants');
const rs232 = require('./lib/rs232');
const logger = require('../lib/logger')('Adapters');

const adapters = {
  [constants.TYPE_VIZIO]: VizioAdapter,
  [constants.TYPE_NEC]: NecAdapter,
  [constants.TYPE_SAMSUNG]: SamsungAdapter,
};

let activeAdapter = null;
let initPromise;

const _initAdapter = async (levelDb       ) => { // eslint-disable-line no-underscore-dangle
  logger.info('Initializing adapters');
  try {
    const device = await levelDb.get(constants.LEVEL_DB_DEVICE);
    if (device && device.data && device.type) {
      const Adapter = adapters[device.type];
      const adapterInstance = new Adapter({ ...device.data, ready: true }, device);
      activeAdapter = adapterInstance;
    } else {
      discover(levelDb);
    }
  } catch (error) {
    logger.error('Failed to initialize adapter');
    logger.errorStack(error);
  }
};

const initAdapter = (levelDb       ) => {
  if (!initPromise) {
    initPromise = _initAdapter(levelDb);
  }
  return initPromise;
};

const setActiveAdapter = async (adapter        ) => {
  await closeAdapter();
  activeAdapter = adapter;
};

const getActiveAdapter = async () => activeAdapter;

const closeAdapter = async () => {
  if (activeAdapter && activeAdapter.close) {
    await activeAdapter.close();
  }
};

let discoveryPromise;
const discover = async (levelDb        ) => {
  if (discoveryPromise) {
    return discoveryPromise;
  }

  const _discover = async () => { // eslint-disable-line no-underscore-dangle
    if (activeAdapter) {
      if (activeAdapter.ready) {
        return;
      }
      await setActiveAdapter(null);
    }

    const ports = await rs232.discover();
    if (!(ports.length > 0)) {
      return;
    }

    const adapterTypes = Object.keys(adapters);
    let initialized = false;
    for (const adapterType of adapterTypes) {
      if (adapterType === constants.TYPE_VIZIO) {
        continue;
      }

      const Adapter = adapters[adapterType];
      for (const port of ports) {
        const data         = {
          path: port.comName,
          type: adapterType,
        };
        let adapterInstance;
        try {
          adapterInstance = new Adapter(data, levelDb);
          await adapterInstance.initialize();
          // $FlowFixMe
          await adapterInstance.pair();
          await setActiveAdapter(adapterInstance);
          initialized = true;
          break;
        } catch (error) {
          if (adapterInstance) {
            await adapterInstance.close();
          }
        }
      }

      if (initialized) {
        break;
      }
    }
  };

  discoveryPromise = _discover();
  return discoveryPromise
    .then(() => {
      discoveryPromise = null;
    })
    .catch(() => {
      discoveryPromise = null;
    });
};

module.exports = {
  ...adapters,
  initAdapter,
  setActiveAdapter,
  getActiveAdapter,
  closeAdapter,
  discover,
};
