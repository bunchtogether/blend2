// @flow

const Smartcast = require('vizio-smart-cast');
const logger = require('../../lib/logger')('Vizio');

type DataType = {
  ip: string,
};

type PairDataType = {
  code: string,
};

class VizioAdapter {
  static async discover(): Promise<*> {
    const devices = [];
    const timeout = 4000;
    await new Promise((resolve: Function) => {
      Smartcast.discover(
        (device: Object) => {
          logger.info(`New device discovered: ${JSON.stringify(device)}`);
          devices.push(device);
        },
        (error: string) => {
          logger.warn(`Discovery: ${error}`);
        },
        timeout,
      );
      setTimeout(resolve, timeout);
    });
    return devices;
  }
  constructor(data: DataType) {
    if (!data || !data.ip) {
      logger.error('Can not instantiate VizioAdapter. Missing required parameter ip');
      throw new Error('Can not instantiate VizioAdapter. Missing required parameter ip');
    }
    this.vizio = new Smartcast(data.ip);
  }

  initialize() {
    return this.vizio.pairing.initiate();
  }

  pair(data: PairDataType) {
    if (!data || !data.code) {
      logger.error('Can not pair. Missing required parameter code');
      throw new Error('Can not pair. Missing required parameter code');
    }
    return this.vizio.pairing.pair(data.code);
  }

  vizio: Object;
}

module.exports = VizioAdapter;
