//      

const network = require('network');
const logger = require('./logger')('Network');

const getActiveInterface = module.exports.getActiveInterface = async () => new Promise((resolve, reject) => {
  network.get_active_interface((err, data) => {
    if(err) {
      reject(err);
    }
    resolve(data);
  })
})

module.exports.getActiveInterfaceMac = async () => {
  const network = await getActiveInterface();
  return network.mac_address;
}