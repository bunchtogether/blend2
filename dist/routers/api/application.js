//      

const { Router } = require('express');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const util = require('util');
const logger = require('../../lib/logger')('Application API');
const crypto = require('crypto');
const robot = require('robotjs');
const { switchToBand, hideBand } = require('../../lib/window-control');

const applicationScriptsDir = path.resolve('scripts/application');
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const execPromise = util.promisify(exec);

const startLaunchScript = async (targetPath        ) => {
  const fileLaunchPath = path.resolve(applicationScriptsDir, 'launcher.ps1');
  const fileCheckRunningPath = path.resolve(applicationScriptsDir, 'check-running.ps1');
  const processName = path.parse(targetPath).name;
  const { stderr } = await execPromise(`Powershell.exe  -executionpolicy ByPass  -File "${fileLaunchPath}" -filePath "${targetPath}"`);
  hideBand(30, 100).catch((error) => {
    logger.error('Switch to launched application - failed');
    logger.errorStack(error);
  });
  const { stdout } = await execPromise(`Powershell.exe  -executionpolicy ByPass  -windowstyle hidden -File "${fileCheckRunningPath}" -processName "${processName}"`);
  if (stdout) {
    switchToBand().catch((error) => {
      logger.error('Switch to Band failed');
      logger.errorStack(error);
    });
  }
  if (stderr) {
    logger.error('Launch powershell script error');
    logger.errorStack(stderr);
  }
};

const startStopProcessScript = async (processName        ) => {
  const filePath = path.resolve(applicationScriptsDir, 'stop-process.ps1');
  const { stderr } = await execPromise(`Powershell.exe  -executionpolicy ByPass  -File "${filePath}" -processName "${processName}"`);
  switchToBand().catch((error) => {
    logger.error('Switch to Band failed');
    logger.errorStack(error);
  });
  if (stderr) {
    logger.error('Powershell stop process script error');
    logger.errorStack(stderr);
  }
};

const getApplicationIcons = async () => {
  const exePath = path.resolve(applicationScriptsDir, 'ExtractLargeIconFromFile.exe');
  const { stderr } = await execPromise(`"${exePath}"`);
  if (stderr) {
    logger.error('ExtractLargeIconFromFile exe error');
    logger.errorStack(stderr);
  }
};

const getApplicationList = async () => {
  const applicationInformation = {};
  const applicationIconPath = path.join(os.tmpdir(), 'blend-application-icons');
  const filePath = path.resolve(applicationScriptsDir, 'appProperties.ps1');
  let files = [];
  let pathElements;
  let appProperties;

  try {
    files = await readdir(applicationIconPath);
    const { stdout } = await execPromise(`Powershell.exe  -executionpolicy ByPass  -File "${filePath}"`);
    appProperties = JSON.parse(stdout);
  } catch (err) {
    logger.error('Read icon folder error');
    logger.errorStack(err);
  }

  await Promise.all(files.map(async (file        ) => {
    const iconFile = await readFile(`${applicationIconPath}/${file}`);
    const md5Hash = crypto.createHash('md5').update(iconFile).digest('hex');
    const iconName = file.slice(0, -4);
    try {
      if (appProperties[iconName]) {
        pathElements = path.parse(appProperties[iconName]);

        if (pathElements.ext === '.exe') {
          applicationInformation[iconName] = {
            name: iconName,
            icon: md5Hash,
            processName: pathElements.name,
            updated: Date.now(),
          };
        }
      }
    } catch (err) {
      logger.error('Exec application id powershell error in list');
      logger.errorStack(err);
    }
  }));
  return applicationInformation;
};

const getIconImageList = async (iconRequests        ) => {
  const iconImageList = {};
  const applicationIconPath = path.join(os.tmpdir(), 'blend-application-icons');
  let files = [];

  try {
    files = await readdir(applicationIconPath);
  } catch (err) {
    logger.error('Read icon folder when getting icon image list error');
    logger.errorStack(err);
  }

  try {
    await Promise.all(files.map(async (file        ) => {
      const iconName = file.slice(0, -4);
      if (iconRequests[iconName]) {
        const iconFile = await readFile(`${applicationIconPath}/${file}`);
        iconImageList[iconName] = iconFile;
      }
    }));
  } catch (err) {
    logger.error('Read icon file error');
    logger.errorStack(err);
  }

  return iconImageList;
};

module.exports.getApplicationRouter = () => {
  logger.info('Attaching Application router');

  const router = Router({ mergeParams: true });

  router.get('/check', async (req                 , res                  ) => {
    res.send(true);
  })

  router.post('/launch', async (req                 , res                  ) => {
    const filePath = path.resolve(applicationScriptsDir, 'appProperties.ps1');
    const { body: { applicationName } } = req;
    let appProperties;
    try {
      const { stdout } = await execPromise(`Powershell.exe  -executionpolicy ByPass  -File "${filePath}"`);
      appProperties = JSON.parse(stdout);
      await startLaunchScript(appProperties[applicationName]);
      res.sendStatus(200);
    } catch (error) {
      logger.error('Can not launch application');
      logger.errorStack(error);
      res.status(400).send('Can not launch application');
    }
  });

  router.get('/application-list', async (req                 , res                  ) => {
    try {
      await getApplicationIcons();
      const response = await getApplicationList();
      res.status(200).send(response);
    } catch (error) {
      logger.error('Can not get application information list');
      logger.errorStack(error);
      res.status(400).send('Can not get application information list');
    }
  });

  router.post('/icon-image-list', async (req                 , res                  ) => {
    const iconRequests = req.body;
    try {
      await getApplicationIcons();
      const response = await getIconImageList(iconRequests);
      res.status(200).send(response);
    } catch (error) {
      logger.error('Can not get application information');
      logger.errorStack(error);
      res.status(400).send('Can not get application information');
    }
  });

  router.post('/stop', async (req                 , res                  ) => {
    const { body: { processName } } = req;
    try {
      await startStopProcessScript(processName);
      res.sendStatus(200);
    } catch (error) {
      logger.error('Can not stop application');
      logger.errorStack(error);
      res.status(400).send('Can not stop application');
    }
  });

  function randomInteger() {
    return crypto.randomBytes(4).readUInt32BE(0, true);
  }

  // Active sockets
  //   Key: Socket ID
  //   Value: Socket object
  const sockets = new Map();

  router.ws('/mouse', async (ws       ) => {
    if (!ws) {
      logger.error('WebSocket object does not exist');
      return;
    }

    const socketId = randomInteger();
    sockets.set(socketId, ws);
    logger.info(`Opened socket ID ${socketId}`);

    let heartbeatTimeout;

    ws.on('message', (event) => {
      const parsedEvent = JSON.parse(event);
      try {
        if (Array.isArray(parsedEvent)) {
          robot.setMouseDelay(0);
          robot.setKeyboardDelay(0);
          const coordinates = JSON.parse(event);
          const { x: X, y: Y } = robot.getMousePos();
          robot.moveMouse(X + (2 * coordinates[0]), Y + (2 * coordinates[1]));
        }

        if (parsedEvent.mouseRightClick) {
          robot.mouseClick('right');
        }

        if (parsedEvent.mouseLeftClick) {
          robot.mouseClick('left');
        }

        if (parsedEvent.keyboard && parsedEvent.keyboard.length === 1) {
          robot.typeString(parsedEvent.keyboard);
        }

        if (parsedEvent.keyboard && parsedEvent.keyboard.length > 1) {
          robot.keyTap(parsedEvent.keyboard);
        }
      } catch (error) {
        logger.error('RobotJs event error');
      }
    });

    ws.on('close', () => {
      clearTimeout(heartbeatTimeout);
      try {
        logger.info(`Closed socket ${socketId}`);
        sockets.delete(socketId);
      } catch (error) {
        if (error.stack) {
          logger.error('Error closing websocket:');
          error.stack.split('\n').forEach((line) => logger.error(`\t${line}`));
        } else {
          logger.error(`Error closing websocket: ${error.message}`);
        }
      }
    });
  });

  return router;
};
