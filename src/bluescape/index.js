// @flow

const ps = require('ps-node');
const { setForegroundWindow } = require('../lib/picture-in-picture');
const logger = require('../lib/logger')('Bluescape Control');

async function isAvailable() {
  const result = await new Promise((resolve: Function, reject: Function) => {
    ps.lookup({ command: 'tsx_winmaster' }, (err: Object, res: Array<*>) => {
      if(err) {
        reject(err);
      }
      resolve(res);
    });
  });
  console.log(result)
}

async function focus() {
  logger.info('Switching to Bluescape');
  await setForegroundWindow('tsx_winslave');
}



module.exports = {
  isAvailable,
  focus,
};
