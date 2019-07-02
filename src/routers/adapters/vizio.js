// @flow

const Smartcast = require('vizio-smart-cast');
const logger = require('../../lib/logger')('Vizio');

type DataType = {
  ip: string,
  name: string,
  manufacturer: string,
  model: string,
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
      logger.error('Can not instantiate. Missing required parameter ip');
      throw new Error('Can not instantiate. Missing required parameter ip');
    }
    this.ip = data.ip;
    this.name = data.name;
    this.manufacturer = data.manufacturer;
    this.model = data.model;
    this.ready = false;
    this.vizio = new Smartcast(data.ip);
  }

  initialize() {
    return this.vizio.pairing.initiate();
  }

  async pair(data: PairDataType) {
    if (!data || !data.code) {
      logger.error('Can not pair. Missing required parameter code');
      throw new Error('Can not pair. Missing required parameter code');
    }
    const result = await this.vizio.pairing.pair(data.code);
    this.ready = true;
    return result;
  }

  getDevice() {
    return {
      ip: this.ip,
      name: this.name,
      manufacturer: this.manufacturer,
      model: this.model,
      type: 'vizio',
    };
  }

  ip: string;
  name: string;
  manufacturer: string;
  model: string;
  ready: boolean;
  vizio: Object;
}

module.exports = VizioAdapter;
