//      

const ps = require('ps-node');
const { setForegroundWindow } = require('../lib/picture-in-picture');
const logger = require('../lib/logger')('Bluescape Control');

async function isAvailable() {
  const result = await new Promise((resolve          , reject          ) => {
    ps.lookup({ command: 'tsx_winmaster' }, (err        , res          ) => {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
  return Array.isArray(result) && result.length > 0;
}

async function focus() {
  logger.info('Switching to Bluescape');
  await setForegroundWindow('tsx_winslave');
}


module.exports = {
  isAvailable,
  focus,
};
