// @flow

const Sequelize = require('sequelize');
// const logger = require('../lib/logger')('Device Model');

const DEVICE_ID = 'e7a45a96-f2ce-444e-8568-ad9c0f88db00';

const initDevice = async (db: Object) => {
  const Device = db.define('device', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    type: {
      type: Sequelize.STRING,
    },
    data: {
      type: Sequelize.JSONB,
    },
  }, {
    timestamps: true,
    underscored: true,
  });
  Device.id = DEVICE_ID;
  await Device.sync({ alter: true });
  await Device.upsert({ id: Device.id });
  return Device;
};

module.exports = { initDevice };
