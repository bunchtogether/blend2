//      

const macaddress = require('macaddress');
const logger = require('./logger')('MAC Address');

let cachedAddress;

const getActiveInterfaceMac = async ()                 => {
  if (cachedAddress) {
    return cachedAddress;
  }
  return new Promise((resolve, reject) => {
    macaddress.one((error, addr) => {
      if (error) {
        reject(error);
      } else {
        logger.info(`Found ${addr}`);
        cachedAddress = addr;
        resolve(addr);
      }
    });
  });
};

getActiveInterfaceMac().catch((error) => {
  logger.error('Unable to get MAC address');
  logger.errorStack(error);
});

module.exports.getActiveInterfaceMac = getActiveInterfaceMac;
