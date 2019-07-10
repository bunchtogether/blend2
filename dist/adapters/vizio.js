//      

                                             

const Smartcast = require('vizio-smart-cast');
const { TYPE_VIZIO } = require('../constants');
const { getDevice: getDeviceModel } = require('../models');
const AbstractAdapter = require('./adapter');
const logger = require('../lib/logger')('Vizio');

                 
             
               
                       
                
                     
                  
  

                     
               
  

(x              ) => (x             ); // eslint-disable-line no-unused-expressions
class VizioAdapter extends AbstractAdapter {
  static async discover()             {
    const devices = [];
    const timeout = 4000;
    await new Promise((resolve          ) => {
      Smartcast.discover(
        (device        ) => {
          logger.info(`New device discovered: ${JSON.stringify(device)}`);
          device.type = TYPE_VIZIO; // eslint-disable-line no-param-reassign
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
    super();
    this.ip = data.ip;
    this.name = data.name;
    this.manufacturer = data.manufacturer;
    this.model = data.model;
    this.ready = !!data.ready;
    this.vizio = new Smartcast(data.ip, data.authToken);
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
    const { ITEM: { AUTH_TOKEN } } = result;
    if (AUTH_TOKEN) {
      this.ready = true;
      const device = await getDeviceModel();
      await device.update({
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

  async setPower(power         ) {
    if (power) {
      await this.vizio.control.power.on();
      return true;
    }
    await this.vizio.control.power.off();
    return false;
  }

  async setVolume(volume        ) {
    const { PARAMETERS: { VALUE } } = await this.vizio.control.volume.set(volume);
    return VALUE;
  }

  async setSource(source        ) {
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
    try {
      const { ITEMS: [{ VALUE: power }] } = await this.vizio.power.currentMode();
      const { ITEMS: [{ VALUE: source }] } = await this.vizio.input.current();
      const { ITEMS: sources } = await this.vizio.input.list();
      const { ITEMS: [{ VALUE: volume }] } = await this.vizio.control.volume.get();
      const { ITEMS: [{ VALUE: mute }] } = await this.vizio.control.volume.getMuteState();
      let sourceName;
      sources.forEach((sourceData        ) => {
        if (sourceData.CNAME === source) {
          sourceName = sourceData.VALUE.NAME;
        }
      });
      return {
        ip: this.ip,
        name: this.name,
        manufacturer: this.manufacturer,
        model: this.model,
        type: TYPE_VIZIO,
        power: !!power,
        source: sourceName || source,
        volume,
        mute: mute !== 'Off',
        sources: sources.map((sourceData        ) => sourceData.VALUE.NAME),
      };
    } catch (error) {
      logger.error('Error getting device data');
      logger.errorStack(error);
      throw error;
    }
  }

  async close() {
    await Promise.resolve();
  }

             
               
                       
                
                 
                
}

module.exports = VizioAdapter;
