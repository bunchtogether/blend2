// @flow

const os = require('os');
const path = require('path');
const commander = require('commander');
const packageInfo = require('../package.json');

commander
  .name('blend')
  .usage('[options]')
  .option('-v, --version', 'Display blend version', false)
  .option('-c, --config <path>', 'Blend config path, overwrite BLEND_CONFIG env variable.')
  .option('-u, --update-check <path>', 'Band update-check script path, overwrite BAND_UPDATE_CHECK env variable.')
  .parse(process.argv);

if (commander.version) {
  console.log(`Blend v${packageInfo.version}`); //eslint-disable-line
  process.exit(0);
}
if (commander.config) {
  // Overwrite band config.json file path
  process.env.BLEND_CONFIG = commander.config;
}
if (commander.updateCheck) {
  // Overwrite band auto update check script
  process.env.BAND_UPDATE_CHECK = commander.updateCheck;
}

const fs = require('fs-extra');
const getExpressApp = require('./express-app');
const startHttpServer = require('./http-server');
const getRouters = require('./routers');
const getLevelDb = require('./database');
const { initAdapter, closeAdapter } = require('./adapters');
const { API_PORT } = require('./constants');
const { addShutdownHandler, addPostShutdownHandler, runShutdownHandlers } = require('@bunchtogether/exit-handler');
const logger = require('./lib/logger')('CLI');

let switchToBandFn = null;
if (os.platform() === 'win32') {
  const { switchToBand } = require('./lib/window-control'); // eslint-disable-line global-require
  switchToBandFn = switchToBand;
}

let exitCode = 0;
const triggerSwitchToBand = async ():Promise<void> => {
  if (os.platform() === 'win32' && switchToBandFn !== null) {
    await switchToBandFn();
  }
};

const start = async ():Promise<void> => {
  logger.info(`Starting Blend v${packageInfo.version}`);
  const dataPath = path.join(os.homedir(), '.blend');
  const levelDbPath = path.join(dataPath, 'leveldb');
  await fs.ensureDir(dataPath);
  await fs.ensureDir(levelDbPath);

  const [levelDb, closeLevelDb] = await getLevelDb(levelDbPath);
  await initAdapter(levelDb);

  const app = getExpressApp();
  const stopHttpServer = await startHttpServer(app, API_PORT);
  const [routers, shutdownRouters] = getRouters(levelDb);
  app.use(routers);

  // Create tables in database

  process.on('uncaughtException', (error) => {
    if (error.stack) {
      logger.error('Uncaught exception:');
      error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
    } else {
      logger.error(`Uncaught exception: ${error.message}`);
    }
    exitCode = 1;
    runShutdownHandlers();
  });

  process.on('unhandledRejection', (error) => {
    if (error.stack) {
      logger.error('Unhandled rejection:');
      error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
    } else {
      logger.error(`Unhandled rejection: ${error.message}`);
    }
    exitCode = 1;
    runShutdownHandlers();
  });

  const shutdown = async () => {
    logger.info('Shutting down');
    try {
      await closeAdapter();
    } catch (error) {
      logger.error('Error closing adapter');
      logger.errorStack(error);
    }
    try {
      await shutdownRouters();
    } catch (error) {
      logger.error('Error shutting down routers');
      logger.errorStack(error);
    }
    try {
      await stopHttpServer();
    } catch (error) {
      logger.error('Error shutting down HTTP server');
      logger.errorStack(error);
    }
    try {
      await closeLevelDb();
    } catch (error) {
      logger.error('Error closing Level database');
      logger.errorStack(error);
    }
    logger.info(`Shut down Blend v${packageInfo.version}`);
  };

  addShutdownHandler(shutdown, (error:Error) => {
    if (error.stack) {
      logger.error('Error shutting down:');
      error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
    } else {
      logger.error(`Error shutting down: ${error.message}`);
    }
  });

  await triggerSwitchToBand();

  logger.info('Started');
};

addPostShutdownHandler(() => {
  process.exit(exitCode);
});

start().catch((error) => {
  logger.error('Error starting:');
  logger.error(error.message);
  logger.errorStack(error);
  exitCode = 1;
  runShutdownHandlers();
});
