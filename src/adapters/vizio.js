// @flow

const Smartcast = require('vizio-smart-cast');
const { VIZIO } = require('../constants');
const { getDevice: getDeviceModel } = require('../models');
const logger = require('../lib/logger')('Vizio');

type DataType = {
  ip: string,
  name: string,
  manufacturer: string,
  model: string,
  authToken?: string
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
    this.ready = !!data.authToken;
    this.vizio = new Smartcast(data.ip, data.authToken);
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
    const { ITEM: { AUTH_TOKEN } } = result;
    if (AUTH_TOKEN) {
      this.ready = true;
      const device = await getDeviceModel();
      await device.update({
        data: {
          ip: this.ip,
          name: this.name,
          manufacturer: this.manufacturer,
          model: this.model,
          type: VIZIO,
          authToken: AUTH_TOKEN,
        },
      });
    }
    return result;
  }

  getDevice() {
    return {
      ip: this.ip,
      name: this.name,
      manufacturer: this.manufacturer,
      model: this.model,
      type: VIZIO,
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
