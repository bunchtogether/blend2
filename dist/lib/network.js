//      

const macaddress = require('macaddress');
const logger = require('./logger')('MAC Address');

let cachedAddress;
let cachedIPAddress;

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

const getActiveInterfaceIPAddress = async ()                 => {
  if (cachedIPAddress) {
    return cachedIPAddress;
  }
  const macAddress = await getActiveInterfaceMac();
  const interfaces = macaddress.networkInterfaces();
  for (const netInterface of Object.values(interfaces)) {
    if (netInterface.mac === macAddress) {
      cachedIPAddress = netInterface.ipv4;
    }
  }
  return cachedIPAddress
}

getActiveInterfaceMac().catch((error) => {
  logger.error('Unable to get MAC address');
  logger.errorStack(error);
});

getActiveInterfaceIPAddress().catch((error) => {
  logger.error('Unable to get IP address');
  logger.errorStack(error);
})

module.exports.getActiveInterfaceMac = getActiveInterfaceMac;
module.exports.getActiveInterfaceIPAddress = getActiveInterfaceIPAddress;
