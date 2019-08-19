// @flow

const SerialPort = require('serialport');
const manufacturers = require('../../manufacturers');

async function discover(): Promise<Array<Object>> {
  const list = await SerialPort.list();
  return list.filter((port: Object) => manufacturers.some((manufacturer: string) => port.manufacturer && port.manufacturer.indexOf(manufacturer) !== -1));
}

module.exports = {
  discover,
};
