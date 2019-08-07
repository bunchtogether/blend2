//      

const { setForegroundWindow } = require('../lib/picture-in-picture');
const logger = require('../lib/logger')('Bluescape Control');

async function focus() {
  logger.info('Switching to Bluescape')
  await setForegroundWindow('tsx_winslave');
}

module.exports = {
  focus,
};
