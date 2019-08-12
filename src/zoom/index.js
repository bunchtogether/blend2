// @flow

const find = require('find-process');
const logger = require('../lib/logger')('Zoom Control');


const resultPromise = find('name', 'ZoomRooms', true).catch((error) => {
  logger.error('Error while finding process');
  logger.errorStack(error);
});

async function isAvailable() {
  const result = await resultPromise;
  return Array.isArray(result) && result.length > 0;
}

module.exports = {
  isAvailable,
};
