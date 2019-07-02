//      

const Smartcast = require('vizio-smart-cast');
const logger = require('../../lib/logger')('Vizio');

                 
             
               
                       
                
  

                     
               
  

class VizioAdapter {
  static async discover()             {
    const devices = [];
    const timeout = 4000;
    await new Promise((resolve          ) => {
      Smartcast.discover(
        (device        ) => {
          logger.info(`New device discovered: ${JSON.stringify(device)}`);
          devices.push(device);
        },
        (error        ) => {
          logger.warn(`Discovery: ${error}`);
        },
        timeout,
      );
      setTimeout(resolve, timeout);
    });
    return devices;
  }

  constructor(data          ) {
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

  async pair(data              ) {
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

             
               
                       
                
                 
                
}

module.exports = VizioAdapter;
