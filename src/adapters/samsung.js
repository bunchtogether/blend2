// @flow

import type { AdapterType } from './adapter';

const SerialPort = require('serialport');
const { TYPE_SAMSUNG, LEVEL_DB_DEVICE } = require('../constants');
const AbstractAdapter = require('./adapter');
const manufacturers = require('../manufacturers');
const logger = require('../lib/logger')('Samsung Adapter');

type DataType = {
  path: string,
  ready?: boolean,
};

const sources = {
  TV: '08220A000000CC',
  'AV-1': '08220A000100CB',
  'AV-2': '08220A000101CA',
  'AV-3': '08220A000102C9',
  'Svideo-1': '08220A000200CA',
  'Svideo-2': '08220A000201C9',
  'Svideo-3': '08220A000202C8',
  'Component-1': '08220A000300C9',
  'Component-2': '08220A000301C8',
  'Component-3': '08220A000302C7',
  'PC-1': '08220A000400C8',
  'PC-2': '08220A000401C7',
  'PC-3': '08220A000402C6',
  'HDMI-1': '08220A000500C7',
  'HDMI-2': '08220A000501C6',
  'HDMI-3': '08220A000502C5',
  'HDMI-4': '08220A000503C4',
  'DVI-1': '08220A000600C6',
  'DVI-2': '08220A000601C5',
  'DVI-3': '08220A000602C4',
};

function toHex(num: number, pad: number = 2) {
  return num.toString(16).toUpperCase().padStart(pad, '0');
}

const addCheckSum = function (hexCode: string) {
  let result = (hexCode.match(/.{2}/g) || []).reduce((sum, n) => sum + parseInt(n, 16), 0);
  result = (~result + 1) & 0xff;
  return `${hexCode}${toHex(Math.floor(result / 16), 1)}${toHex(result % 16, 1)}`;
};

(x: SamsungAdapter) => (x: AdapterType); // eslint-disable-line no-unused-expressions
class SamsungAdapter extends AbstractAdapter {
  static async discover(): Promise<*> {
    const list = await SerialPort.list();
    return list.filter((port: Object) => manufacturers.some((manufacturer: string) => port.manufacturer && port.manufacturer.indexOf(manufacturer) !== -1)).map((port: Object) => ({
      path: port.comName,
      type: TYPE_SAMSUNG, // eslint-disable-line no-param-reassign
    }));
  }

  constructor(data: DataType, levelDb: Object) {
    if (!data || !data.path) {
      logger.error('Can not instantiate. Missing required parameter path');
      throw new Error('Can not instantiate. Missing required parameter path');
    }
    super();
    this.levelDb = levelDb;
    this.path = data.path;
    this.ready = !!data.ready;
    this.port = new SerialPort(data.path, (error) => {
      if (error) {
        this.ready = false;
      }
    });
    this.port.on('close', () => {
      this.ready = false;
    });
    this.port.on('error', () => {
      this.ready = false;
    });
  }

  async write(command: string, forceWrite: boolean = false) {
    const connectionError = new Error('Unable to connect to Samsung display');
    if (!this.ready && !forceWrite) {
      throw connectionError;
    }
    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(connectionError), 2000);
      this.port.drain((error) => {
        clearTimeout(timeoutId);
        if (error) {
          if (error.message === 'Error: Device not configured, cannot drain') {
            this.ready = false;
            reject(connectionError);
          }
          logger.error(`Error draining port ${error}`);
          reject(error);
        }
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(connectionError), 2000);
      this.port.write(Buffer.from(command, 'hex'), (error) => {
        clearTimeout(timeoutId);
        if (error) {
          logger.error(`Error draining port ${error}`);
          reject(error);
        }
        resolve();
      });
    });
  }

  initialize() {
    const logError = (error) => {
      logger.error('Error initializing adapter');
      logger.errorStack(error);
    };
    this.setPower(false, true).catch(logError);
    setTimeout(() => this.setPower(true, true).catch(logError), 15000);
  }

  async pair() {
    const deviceUpdate = {
      type: TYPE_SAMSUNG,
      data: {
        path: this.path,
      },
    };
    await this.levelDb.put(LEVEL_DB_DEVICE, deviceUpdate);
    this.ready = true;
    return deviceUpdate;
  }

  async setPower(power: boolean, forceWrite: boolean = false) {
    if (power) {
      await this.write('082200000002D4', forceWrite);
    } else {
      await this.write('082200000001D5', forceWrite);
    }
    return power;
  }

  async setVolume(volume: number) {
    await this.write(addCheckSum(`0822010000${toHex(volume)}`));
    return volume;
  }

  async setSource(source: string) {
    const code = sources[source];
    if (!code) {
      logger.error(`Cannot set source. Unknown source ${source}`);
      throw new Error(`Unknown source ${source}`);
    }
    await this.write(code);
    return source;
  }

  getDevice() {
    if (!this.ready) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      type: TYPE_SAMSUNG,
      // $FlowFixMe
      sources: Object.keys(sources),
      manufacturer: 'Samsung',
      path: this.path,
    });
  }

  async close() {
    if (this.port.isOpen) {
      await new Promise((resolve, reject) => {
        this.port.close((err) => {
          if (err) {
            logger.error(`Failed to close Samsung adapter ${err}`);
            reject(err);
          }
          resolve();
        });
      });
    }
  }

  ready: boolean;
  path: string;
  levelDb: Object;
  port: Object;
}

module.exports = SamsungAdapter;
