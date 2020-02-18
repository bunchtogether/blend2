// @flow

const os = require('os');
const path = require('path');
const commander = require('commander');
const getAppDataPath = require('appdata-path');
const packageInfo = require('../package.json');

const dataPath = path.join(getAppDataPath(), 'blend');
const defaultLogsPath = path.join(dataPath, 'logs');

commander
  .name('blend')
  .usage('[options]')
  .version(packageInfo.version, '-v, --version', 'Display blend version')
  .option('-l, --logs <directory path>', 'Blend logs folder', defaultLogsPath)
  .option('-c, --config <path>', 'Blend config path, overwrite BLEND_CONFIG env variable.')
  .option('-u, --update-check <path>', 'Band update-check script path, overwrite BAND_UPDATE_CHECK env variable.')
  .option('-p, --pid-file <path>', 'Band update-check PID lock filepath, overwrite BAND_UPDATE_CHECK_LOCK env variable.')
  .option('-k, --kiosk', 'Kiosk mode', false)
  .option('-t, --tray', 'System tray icon', false)
  .parse(process.argv);

if (commander.logs) {
  process.env.BLEND_LOGS_DIR = commander.logs;
}

if (commander.config) {
  // Overwrite band config.json file path
  process.env.BLEND_CONFIG = commander.config;
}

if (commander.updateCheck) {
  // Overwrite band auto update check script
  process.env.BAND_UPDATE_CHECK = commander.updateCheck;
}

if (commander.pidFile) {
  // Overwrite band auto update check script
  process.env.BAND_UPDATE_CHECK_LOCK = commander.pidFile;
}

if (commander.kiosk) {
  // Kiosk mode
  process.env.KIOSK_MODE = 'true';
}

if (commander.tray) {
  process.env.ENABLE_TRAY_ICON = 'true';
}

const fs = require('fs-extra');
const getExpressApp = require('./express-app');
const startHttpServer = require('./http-server');
const getRouters = require('./routers');
const getLevelDb = require('./database');
const { initAdapter, closeAdapter } = require('./adapters');
const { API_PORT, KIOSK_MODE, ENABLE_TRAY_ICON } = require('./constants');
const { addShutdownHandler, addPostShutdownHandler, runShutdownHandlers } = require('@bunchtogether/exit-handler');
const logger = require('./lib/logger')('CLI');
const { bandIcon } = require('./icon');

let switchToBandFn = null;
const isWindows = os.platform() === 'win32';
if (isWindows) {
  const { waitForChromeToSwitchToBand } = require('./lib/window-control'); // eslint-disable-line global-require
  switchToBandFn = waitForChromeToSwitchToBand;
}

let exitCode = 0;
const triggerSwitchToBand = async (): Promise<void> => {
  logger.info(`Enable Kiosk Mode: ${KIOSK_MODE ? 'TRUE' : 'FALSE'}`);
  if (isWindows && switchToBandFn !== null && KIOSK_MODE) {
    await switchToBandFn();
  }
};

const setupTray = function () {
  if (ENABLE_TRAY_ICON) {
    const SysTray = require('@bunchtogether/node-systray').default; // eslint-disable-line global-require
    const systrayOptions = {
      menu: {
        icon: bandIcon(),
        title: '',
        tooltip: 'Blend Multicast Receiver',
        items: [{
          title: 'Exit',
          tooltip: 'Exit Blend',
          checked: false,
          enabled: true,
        }],
      },
      copyDir: true,
    };
    const systray = new SysTray(systrayOptions);
    const shutdownTray = () => systray.kill(false);

    addShutdownHandler(shutdownTray, (error: Error) => {
      if (error.stack) {
        logger.error('Error shutting down:');
        error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
      } else {
        logger.error(`Error shutting down: ${error.message}`);
      }
    });

    // Trigger shutdown when tray icon is clicked
    systray.onClick((action) => {
      if (action.seq_id === 0) {
        logger.info('Shutting down blend');
        runShutdownHandlers();
      }
    });
  }
};

const start = async (): Promise<void> => {
  logger.info(`Starting Blend v${packageInfo.version}`);
  const levelDbPath = path.join(dataPath, 'leveldb');
  await fs.ensureDir(dataPath);
  await fs.ensureDir(levelDbPath);
  await fs.ensureDir(defaultLogsPath);

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

  addShutdownHandler(shutdown, (error: Error) => {
    if (error.stack) {
      logger.error('Error shutting down:');
      error.stack.split('\n').forEach((line) => logger.error(`\t${line.trim()}`));
    } else {
      logger.error(`Error shutting down: ${error.message}`);
    }
  });

  logger.info('Started');

  // Setup Tray icon
  await setupTray();

  await triggerSwitchToBand();
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
