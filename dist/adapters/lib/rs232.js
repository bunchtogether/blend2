//      

const SerialPort = require('serialport');
const manufacturers = require('../../manufacturers');

async function discover()                         {
  const list = await SerialPort.list();
  return list.filter((port        ) => manufacturers.some((manufacturer        ) => port.manufacturer && port.manufacturer.indexOf(manufacturer) !== -1));
}

module.exports = {
  discover,
};
