// @flow

const Sequelize = require('sequelize');
const logger = require('../lib/logger')('Device Model');

const DEVICE_ID = 'e7a45a96-f2ce-444e-8568-ad9c0f88db00';

let Device;

const defineDevice = (db: Object) => {
  Device = db.define('device', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    data: {
      type: Sequelize.JSONB,
    },
  }, {
    timestamps: true,
    underscored: true,
  });
  Device.id = DEVICE_ID;
  return Device;
};


const initDevice = async (db: Object) => {
  defineDevice(db);
  await Device.sync({ alter: true });
  await Device.upsert({ id: Device.id });
};

const getDevice = () => {
  if (!Device) {
    logger.error('Model not initialized');
    throw new Error('Model not initialized');
  }
  return Device.findByPk(Device.id);
};

module.exports = { getDevice, initDevice };
