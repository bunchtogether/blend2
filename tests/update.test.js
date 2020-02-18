// @flow

const expect = require('expect');
const os = require('os');
const path = require('path');

process.env.BLEND_LOGS_DIR = path.resolve('/tmp/blend');
if (os.platform() === 'linux') {
  process.env.BAND_UPDATE_CHECK = path.resolve('tests/update-check/linux.sh');
} else if (os.platform() === 'darwin') {
  process.env.BAND_UPDATE_CHECK = path.resolve('tests/update-check/darwin.sh');
} else if (os.platform() === 'win32') {
  process.env.BAND_UPDATE_CHECK = path.resolve('tests/update-check/windows.bat');
}

// Timeout
jest.setTimeout(10000);

const { triggerUpdate, triggerLinuxUpdate } = require('../src/lib/update');
const logger = require('../src/lib/logger')('Update Check Test');

describe('Update Check Tests', () => {
  it('Should run single update check', async () => {
    logger.info('Checking for updates ....');
    const statusA = await triggerUpdate();
    console.log('Status A', statusA);
  });

  it('Should start linux update check', async () => {
    logger.info('Checking for updates ....');
    const status = await triggerLinuxUpdate();
    console.log(status);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  it('Should run single update check', async () => {
    logger.info('Checking for updates ....');
    const statusA = await triggerLinuxUpdate();
    expect(statusA.active).toEqual(true);
    const statusB = await triggerLinuxUpdate();
    expect(statusB.active).toEqual(true);
    expect(statusA.pid).toEqual(statusB.pid);
  });
});
