// @flow

const network = require('network');

const getActiveInterface = module.exports.getActiveInterface = async () => new Promise((resolve, reject) => {
  network.get_active_interface((err, data) => {
    if (err) {
      reject(err);
    }
    resolve(data);
  });
});

module.exports.getActiveInterfaceMac = async () => {
  const networkData = await getActiveInterface();
  return networkData.mac_address;
};
