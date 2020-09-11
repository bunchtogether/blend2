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

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const execPromise = util.promisify(exec);

const startLaunchScript = async (targetPath        ) => {
  const filePath = path.join(__dirname, '../../../scripts/application/launcher.ps1');
  const child = exec(`Powershell.exe  -executionpolicy ByPass  -File ${filePath} -filePath ${targetPath}`,
    (err) => {
      if (err) {
        logger.error('Launch powershell script error');
        logger.errorStack(err);
      }
    });

  child.stderr.on('data', (data        ) => {
    logger.error('Powershell launch script error');
    logger.errorStack(data);
  });

  child.stdin.end();
};

const startStopProcessScript = async (processName        ) => {
  const filePath = path.join(__dirname, '../../../scripts/application/stop-process.ps1');
  const { stderr } = await execPromise(`Powershell.exe  -executionpolicy ByPass  -File ${filePath} -processName ${processName}`);
  if (stderr) {
    logger.error('Powershell stop process script error');
    logger.errorStack(stderr);
  }
};

const getApplicationIcons = async () => {
  const exePath = path.join(__dirname, '../../../scripts/application/ExtractLargeIconFromFile.exe');
  const { stderr } = await execPromise(exePath);
  if (stderr) {
    logger.error('ExtractLargeIconFromFile exe error');
    logger.errorStack(stderr);
  }
};

const getApplicationList = async () => {
  const applicationInformation = {};
  const applicationIconPath = path.join(os.tmpdir(), 'blend-application-icons');
  const filePath = path.join(__dirname, '../../../scripts/application/appId.ps1');
  let files = [];
  let appId;

  try {
    files = await readdir(applicationIconPath);
  } catch (err) {
    logger.error('Read icon folder error');
    logger.errorStack(err);
  }

  await Promise.all(files.map(async (file        ) => {
    const iconFile = await readFile(`${applicationIconPath}/${file}`);
    const md5Hash = crypto.createHash('md5').update(iconFile).digest('hex');
    const iconName = file.slice(0, -4);
    try {
      const { stdout, stderr } = await execPromise(`Powershell.exe  -executionpolicy ByPass  -File ${filePath} -name "${iconName}"`);
      if (stderr) {
        logger.error('Get application id powershell error in list');
        logger.errorStack(stderr);
      }
      const applicationObj = JSON.parse(stdout);
      if (Array.isArray(applicationObj)) {
        applicationObj.forEach((app        ) => {
          if (app.Name === iconName) {
            appId = app.AppID;
          }
        });
      } else {
        appId = applicationObj.AppID;
      }
      applicationInformation[appId] = {
        name: iconName,
        icon: md5Hash,
        updated: Date.now(),
      };
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

  router.post('/launch', async (req                 , res                  ) => {
    const { body: { targetPath } } = req;
    try {
      await startLaunchScript(targetPath);
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
          const coordinates = JSON.parse(event);
          const { x: X, y: Y } = robot.getMousePos();
          robot.moveMouse(X + coordinates[0], Y + coordinates[1]);
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
