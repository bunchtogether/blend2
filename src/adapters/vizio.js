// @flow

import type { AdapterType } from './adapter';

const Smartcast = require('vizio-smart-cast');
const { TYPE_VIZIO, LEVEL_DB_DEVICE } = require('../constants');
const AbstractAdapter = require('./adapter');
const logger = require('../lib/logger')('Vizio');

type DataType = {
  ip: string,
  name: string,
  manufacturer: string,
  model: string,
  authToken?: string,
  ready?: boolean,
};

type PairDataType = {
  code: string,
};

(x: VizioAdapter) => (x: AdapterType); // eslint-disable-line no-unused-expressions
class VizioAdapter extends AbstractAdapter {
  static async discover(): Promise<*> {
    const devices = [];
    const timeout = 4000;
    await new Promise((resolve) => {
      Smartcast.discover(
        (device: Object) => {
          device.type = TYPE_VIZIO; // eslint-disable-line no-param-reassign
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

  constructor(data: DataType, levelDb: Object) {
    if (!data || !data.ip) {
      logger.error('Can not instantiate. Missing required parameter ip');
      throw new Error('Can not instantiate. Missing required parameter ip');
    }
    super();
    this.ip = data.ip;
    this.name = data.name;
    this.manufacturer = data.manufacturer;
    this.model = data.model;
    this.ready = !!data.ready;
    this.vizio = new Smartcast(data.ip, data.authToken);
    this.levelDb = levelDb;
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
      await this.levelDb.put(LEVEL_DB_DEVICE, {
        type: TYPE_VIZIO,
        data: {
          ip: this.ip,
          name: this.name,
          manufacturer: this.manufacturer,
          model: this.model,
          authToken: AUTH_TOKEN,
        },
      });
    }
    return result;
  }

  async setPower(power: boolean) {
    if (power) {
      await this.vizio.control.power.on();
      return true;
    }
    await this.vizio.control.power.off();
    return false;
  }

  async setVolume(volume: number) {
    const { PARAMETERS: { VALUE } } = await this.vizio.control.volume.set(volume);
    return VALUE;
  }

  async setSource(source: string) {
    const { PARAMETERS: { VALUE } } = await this.vizio.input.set(source);
    return VALUE;
  }

  async toggleMute() {
    await this.vizio.control.volume.toggleMute();
  }

  async getDevice() {
    if (!this.ready) {
      return Promise.resolve(null);
    }
    let timeout = false;
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        timeout = true;
        reject(new Error('Timeout getting device'));
      }, 3000);
      try {
        const { ITEMS: sources } = await this.vizio.input.list();
        clearTimeout(timeoutId);
        resolve({
          ip: this.ip,
          name: this.name,
          manufacturer: this.manufacturer,
          model: this.model,
          type: TYPE_VIZIO,
          sources: sources.map((sourceData: Object) => sourceData.VALUE.NAME),
        });
      } catch (error) {
        logger.error('Error getting device data');
        logger.errorStack(error);
        if (!timeout) {
          reject(error);
        }
      }
    });
  }

  async close() {
    await Promise.resolve();
  }

  declare ip: string;
  declare name: string;
  declare manufacturer: string;
  declare model: string;
  declare ready: boolean;
  declare vizio: Object;
  declare levelDb: Object;
}

module.exports = VizioAdapter;
