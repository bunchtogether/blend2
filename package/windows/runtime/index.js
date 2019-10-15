/* eslint-disable */

const pm2 = require('pm2');
const fs = require('fs');
const path = require('path');
const { addShutdownHandler, addPostShutdownHandler, runShutdownHandlers } = require('@bunchtogether/exit-handler');

const getBlendRuntimeDir = function() {
  if (process.env.BLEND_RUNTIME_DIR) {
    return path.resolve(process.env.BLEND_RUNTIME_DIR)
  }
  return path.resolve(process.cwd());
}

const isKioskModeEnabled = function() {
  if (process.env.BAND_KIOSK_MODE === 'true') {
    return true
  }
  if (process.env.KIOSK_MODE === 'true') {
    return true
  }
  return false
}

const BLEND_DIRECTORY = getBlendRuntimeDir();
const BLEND_BINARY_PATH = path.resolve(BLEND_RUNTIME_DIR, 'blend.exe');
let exitCode = 0;

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
  await new Promise((resolve, reject) => {
    pm2.connect(true, (error) => {
      if (error) {
        console.log(`Crashed on connecting to pm2, Error: ${error.message}`, error);
        reject(error);
      } else {
        resolve();
      }
    });
  });
  const procs = await new Promise((resolve, reject) => {
    pm2.start({
      name: 'Blend',
      script: BLEND_BINARY_PATH,
      cwd: BLEND_DIRECTORY,
      instances: 1,
      exec_mode: 'fork_mode',
      exec_interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        KIOSK_MODE: isKioskModeEnabled(),
      },
      autorestart: true,
      kill_timeout: 3000,
      restart_delay: 5000,
    }, (error, p) => {
      if (error) {
        console.log(`Error occured while starting blend, Error: ${error.message}`);
        pm2.disconnect();
        reject(error);
      } else {
        resolve(p);
      }
    });
  });

  const shutdown = async () => {
    await new Promise((resolve, reject) => {
      pm2.stop(procs, (error) => {
          if(error) {
            reject(error);
          } else {
            resolve();
          }
      });
    });
    pm2.disconnect();
  }

  addShutdownHandler(shutdown, (error) => {
    console.log(`Error shutting down Blend`);
    console.error(error);
  });

};

addPostShutdownHandler(() => {
  process.exit(exitCode);
});

console.log('Starting Blend runtime');

start().catch((error) => {
  console.log(`Unable to run Blend, Error: ${error.message}`);
  exitCode = 1;
  runShutdownHandlers();
});

