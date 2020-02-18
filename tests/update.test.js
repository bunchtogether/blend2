// @flow

const expect = require('expect');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

process.env.BLEND_LOGS_DIR = path.resolve(os.tmpdir(), 'blend');
process.env.BAND_UPDATE_CHECK_LOCK = path.resolve(os.tmpdir(), 'BLEND_LOCK');
if (os.platform() === 'linux') {
  process.env.BAND_UPDATE_CHECK = path.resolve('tests/update-check/linux.sh');
} else if (os.platform() === 'darwin') {
  process.env.BAND_UPDATE_CHECK = path.resolve('tests/update-check/darwin.sh');
} else if (os.platform() === 'win32') {
  process.env.BAND_UPDATE_CHECK = path.resolve('tests/update-check/windows.bat');
}

// Timeout
jest.setTimeout(30000);

const { triggerUpdate, triggerLinuxUpdate } = require('../src/lib/update');

describe('Update Check Tests', () => {
  beforeAll(async () => {
    if (typeof (process.env.BAND_UPDATE_CHECK_LOCK) === 'string') {
      const lockPath = path.resolve(process.env.BAND_UPDATE_CHECK_LOCK);
      await fs.remove(lockPath);
    }
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  it('Should run single update check', async () => {
    const status = await triggerUpdate();
    expect(typeof (status)).toEqual('object');
    switch (os.platform()) {
      case 'linux':
        expect(status.pid).not.toEqual(null);
        expect(status.pid).toBeGreaterThan(0);
        expect(status.triggered).toEqual(true);
        expect(typeof (status.message)).toEqual('string');
        expect(status.error).toEqual(null);
        await new Promise((resolve) => setTimeout(resolve, 2500));
        break;

      case 'darwin':
        expect(status.pid).toEqual(null);
        expect(status.triggered).toEqual(false);
        expect(status.message).toEqual(null);
        expect(status.error).toEqual('Update Check for Mac OSX is not enabled');
        break;

      case 'win32':
        expect(status.pid).toEqual(null);
        expect(status.triggered).toEqual(false);
        expect(status.message).toEqual(null);
        expect(status.error).toEqual('Update Check for Windows is not enabled');
        break;

      default:
        break;
    }
  });

  it('Should start linux update check', async () => {
    const status = await triggerLinuxUpdate();
    expect(typeof (status.pid)).toEqual('number');
    expect(typeof (status.triggered)).toEqual('boolean');
    expect(typeof (status.message)).toEqual('string');
    expect(status.error).toEqual(null);
    await new Promise((resolve) => setTimeout(resolve, 2500));
  });

  it('Should execute single update check at a time', async () => {
    const statusA = await triggerLinuxUpdate();
    expect(statusA.triggered).toEqual(true);
    const statusB = await triggerLinuxUpdate();
    expect(statusB.triggered).toEqual(false);
    expect(statusA.pid).toEqual(statusB.pid);
    await new Promise((resolve) => setTimeout(resolve, 2500));
  });

  it('Should not run update check when an scheduled update check is active', async () => {
    // Create fake update check process
    const longProcess = spawn('/bin/bash', ['-c', 'echo "start";sleep 60; echo "done"'], {
      detached: true,
      stdio: 'ignore', // ['ignore', 'pipe', 'pipe'],
    });
    longProcess.unref();
    if (typeof (process.env.BAND_UPDATE_CHECK_LOCK) === 'string') {
      await fs.writeFile(process.env.BAND_UPDATE_CHECK_LOCK, longProcess.pid);
      // console.log(process.env.BAND_UPDATE_CHECK_LOCK, longProcess.pid);
    }
    const status = await triggerLinuxUpdate();
    expect(status.pid).toEqual(null);
    expect(status.triggered).toEqual(false);
    expect(status.message).toEqual('Scheduled update check is currently in progress, skipping new check');
    expect(status.error).toEqual(null);
  });
});
