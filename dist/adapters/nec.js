//      

                                             

const SerialPort = require('serialport');
const Delimiter = require('@serialport/parser-delimiter');
const { TYPE_NEC, LEVEL_DB_DEVICE } = require('../constants');
const AbstractAdapter = require('./adapter');
const rs232 = require('./lib/rs232');
const logger = require('../lib/logger')('Nec Adapter');

                 
               
                  
  

const sources = {
  TV: generateCode('302A3045304102303036303030304103'),
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
    const ports = await rs232.discover();
    return ports.map((port        ) => ({
      path: port.comName,
      type: TYPE_NEC,
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
        this.close();
      }
    });
    this.port.on('close', () => {
      this.close();
    });
    this.port.on('error', () => {
      this.close();
    });
    this.openPromise = new Promise((resolve          ) => {
      this.port.on('open', resolve);
    });
    this.parser = this.port.pipe(new Delimiter({ delimiter: Buffer.from([0x0D]) }));
  }

  async write(command        , forceWrite          = false) {
    const connectionError = new Error('Unable to connect to NEC display');
    if (!this.ready && !forceWrite) {
      throw connectionError;
    }
    await this.openPromise;
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

  async initialize() {
    await this.write(generateCode('302A30433036023030363203'), true);
    await this.waitForMessage();
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
    this.ready = false;
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

  async waitForMessage(duration          = 3000)                 {
    await this.openPromise;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.parser.removeListener('error', handleError);
        this.parser.removeListener('data', handleMessage);
        reject(new Error('Timeout while waiting for message'));
      }, duration);
      const handleMessage = (message        ) => {
        clearTimeout(timeout);
        this.parser.removeListener('error', handleError);
        this.parser.removeListener('data', handleMessage);
        resolve([...message].map((n) => toHex(n)));
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
