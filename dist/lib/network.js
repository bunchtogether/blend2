//      

const macaddress = require('macaddress');
const logger = require('./logger')('MAC Address');

const getActiveInterfaceMac = async ()                 => new Promise((resolve, reject) => {
  macaddress.one((error, addr) => {
    if (error) {
      reject(error);
    } else if (!error && addr === '00:00:00:00:00:00') {
      reject(new Error('Cannot find an active network interface'));
    } else {
      logger.info(`Found ${addr}`);
      resolve(addr);
    }
  });
});

const getActiveInterfaceIPAddress = async ()              => {
  const macAddress = await getActiveInterfaceMac();
  const netInterfaces = macaddress.networkInterfaces();
  const filteredInterfaces = Object.values(netInterfaces).filter((netIface) => (netIface && netIface.ipv4 && netIface.mac && netIface.mac === macAddress));
  if (Array.isArray(filteredInterfaces) && filteredInterfaces.length === 1 && filteredInterfaces[0] && filteredInterfaces[0].ipv4) {
    return filteredInterfaces[0].ipv4;
  }
  throw new Error(`Cannot find IPv4 for interface with MAC address ${macAddress}`);
};

getActiveInterfaceMac().catch((error) => {
  logger.error('Unable to get MAC address');
  logger.errorStack(error);
});

getActiveInterfaceIPAddress().catch((error) => {
  logger.error('Unable to get IP address');
  logger.errorStack(error);
});

module.exports.getActiveInterfaceMac = getActiveInterfaceMac;
module.exports.getActiveInterfaceIPAddress = getActiveInterfaceIPAddress;
