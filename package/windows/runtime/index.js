/* eslint-disable */

const pm2 = require('pm2');
const fs = require('fs');
const path = require('path');

const { BLEND_RUNTIME_DIR } = process.env;
if (!BLEND_RUNTIME_DIR) {
  throw new Error('Missing BLEND_RUNTIME_DIR environment variable');
}

const BLEND_DIRECTORY = path.resolve(BLEND_RUNTIME_DIR);
const BLEND_BINARY_PATH = path.resolve(BLEND_RUNTIME_DIR, 'blend.exe');

const checkPath = async (filePath) => {
  return new Promise((resolve) => {
    fs.stat(filePath, (error, stats) => {
      if (error) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

const preStartCheck = async () => {
  const blendFolderExists = await checkPath(BLEND_DIRECTORY)
  const blendBinaryExists = await checkPath(BLEND_BINARY_PATH);
  if (blendFolderExists && blendBinaryExists) {
    return true
  }
  if (!blendFolderExists) {
    throw new Error(`${BLEND_DIRECTORY} directory does not exist`);
  }
  if (!blendBinaryExists) {
    throw new Error(`${BLEND_BINARY_PATH} does not exist`);
  }
}


const start = async () => {
  await preStartCheck();
  pm2.connect(true, (error) => {
    if (error) {
      console.log(`Crashed on connecting to pm2, Error: ${error.message}`, error);
      throw error;
    }

    pm2.start({
      name: 'Blend',
      script: BLEND_BINARY_PATH,
      cwd: BLEND_DIRECTORY,
      instances: 1,
      exec_mode: 'fork_mode',
      exec_interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      kill_timeout: 3000,
      restart_delay: 5000,
    }, (connectError, apps) => {
      if (connectError) {
        console.log(`Error occured while starting blend, Error: ${connectError.message}`);
        pm2.disconnect();
      }
    });
  });
};

try {
  console.log('Starting Blend runtime');
  start();
} catch(error) {
  console.log(`Unable to run blend, Error: ${error.message}`);
  process.exit(1);
}