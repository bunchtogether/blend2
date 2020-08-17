//      

const { Router } = require('express');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const util = require('util');
const crypto = require('crypto');
const logger = require('../../lib/logger')('Application API');

const readdir = util.promisify(fs.readdir);
const execPromise = util.promisify(exec);

const startLaunchScript = async (appID        ) => {
  const filePath = path.join(__dirname, '../../../scripts/application/launcher.ps1');
  const child = exec(`Powershell.exe  -executionpolicy ByPass  -File ${filePath} -appID ${appID}`,
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

const getApplicationIcons = async () => {
  const filePath = path.join(__dirname, '../../../scripts/application/icons.ps1');
  const child = exec(`Powershell.exe  -executionpolicy ByPass  -File ${filePath}`,
    (err) => {
      if (err) {
        logger.error('Get application icon powershell script error');
        logger.errorStack(err);
      }
    });

  child.stdin.end();
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
    const md5Hash = crypto.createHash('md5').update(file).digest('hex');
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
      };
    } catch (err) {
      logger.error('Exec application id powershell error in list');
      logger.errorStack(err);
    }
  }));
  return applicationInformation;
};

const getApplication = async (applicationName        ) => {
  const applicationInformation = {};
  const applicationIconPath = path.join(os.tmpdir(), 'blend-application-icons');
  const filePath = path.join(__dirname, '../../../scripts/application/appId.ps1');
  let files = [];

  try {
    files = await readdir(applicationIconPath);
  } catch (err) {
    logger.error('Read icon folder error');
    logger.errorStack(err);
  }

  const application = files.filter((file        ) => {
    const iconName = file.slice(0, -4);
    return applicationName === iconName;
  });

  if (!application.length) {
    return {};
  }

  const md5Hash = crypto.createHash('md5').update(application[0]).digest('hex');

  try {
    const { stdout, stderr } = await execPromise(`Powershell.exe  -executionpolicy ByPass  -File ${filePath} -name "${applicationName}"`);
    if (stderr) {
      logger.error('Get application id powershell error');
      logger.errorStack(stderr);
    }
    const applicationObj = JSON.parse(stdout);
    if (Array.isArray(applicationObj)) {
      applicationObj.forEach((app        ) => {
        if (app.Name === applicationName) {
          applicationInformation[app.AppID] = {
            name: applicationName,
            icon: md5Hash,
          };
        }
      });
    } else {
      applicationInformation[applicationObj.AppID] = {
        name: applicationName,
        icon: md5Hash,
      };
    }
  } catch (err) {
    logger.error('Exec application id powershell error');
    logger.errorStack(err);
  }
  return applicationInformation;
};

module.exports.getApplicationRouter = () => {
  logger.info('Attaching Application router');

  const router = Router({ mergeParams: true });

  router.post('/launch', async (req                 , res                  ) => {
    const { body: { appID } } = req;
    try {
      await startLaunchScript(appID);
      res.sendStatus(200);
    } catch (error) {
      logger.error('Can not launch application');
      logger.errorStack(error);
      res.status(400).send('Can not launch application');
    }
  });

  router.get('/applicationList', async (req                 , res                  ) => {
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

  router.get('/:applicationName', async (req                 , res                  ) => {
    const { applicationName } = req.params;
    try {
      await getApplicationIcons();
      const response = await getApplication(applicationName);
      res.status(200).send(response);
    } catch (error) {
      logger.error('Can not get application information');
      logger.errorStack(error);
      res.status(400).send('Can not get application information');
    }
  });

  return router;
};
