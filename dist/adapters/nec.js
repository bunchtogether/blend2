//      

                                             

const SerialPort = require('serialport');
const Delimiter = require('@serialport/parser-delimiter');
const { TYPE_NEC, LEVEL_DB_DEVICE } = require('../constants');
const AbstractAdapter = require('./adapter');
const manufacturers = require('../manufacturers');
const logger = require('../lib/logger')('Nec Adapter');

                 
               
                  
  

const sources = {
  VGA: generateCode('302A3045304102303036303030303103'),
  'HDMI-1': generateCode('302A3045304102303036303030313103'),
  'HDMI-2': generateCode('302A3045304102303036303030313203'),
  'HDMI-3': generateCode('302A3045304102303036303030313303'),
  Component: generateCode('302A3045304102303036303030304303'),
  Composite: generateCode('302A3045304102303036303030303503'),
};

function toHex(num        , pad         = 2) {
  return num.toString(16).toUpperCase().padStart(pad, '0');
}

function toAsciiHexCode(char        ) {
  return toHex(char.charCodeAt(0));
}

function addCheckSum(hexCode        ) {
  const checkSum = toHex((hexCode.match(/.{2}/g) || []).map((n) => parseInt(n, 16)).reduce((xor, n) => xor ^ n));
  return `${hexCode}${checkSum}`;
}

function generateCode(command        ) {
  return `01${addCheckSum(command)}0D`;
}

(x            ) => (x             ); // eslint-disable-line no-unused-expressions
class NecAdapter extends AbstractAdapter {
  static async discover()             {
    const list = await SerialPort.list();
    return list.filter((port        ) => manufacturers.some((manufacturer        ) => port.manufacturer && port.manufacturer.indexOf(manufacturer) !== -1)).map((port        ) => ({
      path: port.comName,
      type: TYPE_NEC, // eslint-disable-line no-param-reassign
    }));
  }

  constructor(data          , levelDb        ) {
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
    this.parser = this.port.pipe(new Delimiter({ delimiter: Buffer.from([0x0D]) }));
  }

  async write(command        , forceWrite          = false) {
    const connectionError = new Error('Unable to connect to NEC display');
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
    this.setPower(false).catch(logError);
    setTimeout(() => this.setPower(true).catch(logError), 15000);
  }

  async pair() {
    const deviceUpdate = {
      type: TYPE_NEC,
      data: {
        path: this.path,
      },
    };
    await this.levelDb.put(LEVEL_DB_DEVICE, deviceUpdate);
    this.ready = true;
    return deviceUpdate;
  }

  // TODO
  async togglePower(forceWrite          = false) {
    console.log(forceWrite);
    // await this.write('082200000000D6', forceWrite);
  }

  async setPower(power         ) {
    if (power) {
      await this.write(generateCode('302A30413043024332303344363030303103'));
    } else {
      await this.write(generateCode('302A30413043024332303344363030303403'));
    }
    return power;
  }

  async setVolume(volume        ) {
    const hexString = toHex(volume);
    await this.write(generateCode(`302A3045304102303036320000${toAsciiHexCode(hexString[0])}${toAsciiHexCode(hexString[1])}03`));
    return volume;
  }

  async setSource(source        ) {
    const code = sources[source];
    if (!code) {
      logger.error(`Cannot set source. Unknown source ${source}`);
      throw new Error(`Unknown source ${source}`);
    }
    await this.write(code);
    return source;
  }

  // TODO
  async toggleMute() {
    console.log('toggling');
    await this.write(generateCode('302A30433036023030384403'));
    const message = await this.waitForMessage();
    console.log('message', message);
  }

  getDevice() {
    if (!this.ready) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      type: TYPE_NEC,
      // $FlowFixMe
      sources: Object.keys(sources),
      manufacturer: 'NEC',
      path: this.path,
    });
  }

  async close() {
    if (this.port.isOpen) {
      await new Promise((resolve, reject) => {
        this.port.close((err) => {
          if (err) {
            logger.error(`Failed to close NEC adapter ${err}`);
            reject(err);
          }
          resolve();
        });
      });
    }
  }

  waitForMessage(type        , duration          = 5000)                 {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.parser.removeListener('error', handleError);
        this.parser.removeListener('data', handleMessage);
        reject(new Error('Timeout while waiting for message'));
      }, duration);
      const handleMessage = (message        ) => {
        // if (!type || tk === type) {
        clearTimeout(timeout);
        this.parser.removeListener('error', handleError);
        this.parser.removeListener('data', handleMessage);
        resolve([...message].map((n) => toHex(n)));
        // }
      };
      const handleError = (error) => {
        clearTimeout(timeout);
        this.parser.removeListener('error', handleError);
        this.parser.removeListener('data', handleMessage);
        reject(error);
      };
      this.parser.on('data', handleMessage);
      this.parser.on('error', handleError);
    });
  }

                 
               
                  
               
                 
}

module.exports = NecAdapter;
